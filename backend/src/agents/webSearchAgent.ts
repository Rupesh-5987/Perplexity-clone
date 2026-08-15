import { EventEmitter } from "events";
import {
  RunnableSequence,
  RunnableMap,
  RunnableLambda,
} from "@langchain/core/runnables";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { BaseMessage } from "@langchain/core/messages";
import { getLLM } from "../lib/groq.js";
import { searchSearxng, SearxngResult } from "../services/searxng.js";
import { rerankDocs, processDocs } from "../utils/rerankDocs.js";
import { formatChatHistoryAsString } from "../utils/formatHistory.js";
import { handleStream } from "../utils/handleStream.js";

const webSearchRetrieverPrompt = PromptTemplate.fromTemplate(
  `You are an assistant that rewrites a user's question into a standalone web search query, using the chat history for context. If the question is a greeting or needs no search, respond with exactly "not_needed".

Example:
Follow up question: Who won the last World Cup?
Rephrased: latest FIFA World Cup winner

Example:
Follow up question: What's the weather like in Tokyo?
Rephrased: Tokyo weather forecast

Example:
Follow up question: hi there
Rephrased: not_needed

Chat history:
{chat_history}

Follow up question: {query}
Rephrased:`
);

const webResponsePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "Answer the user's question using ONLY the given context, citing sources inline as [1], [2] matching the numbered context list. If the context is insufficient, say so.\n\nContext:\n{context}",
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{query}"],
]);

function createBasicWebSearchRetrieverChain() {
  return RunnableSequence.from([
    webSearchRetrieverPrompt,
    getLLM(0.3),
    new StringOutputParser(),
    RunnableLambda.from(async (rephrased: string) => {
      const searchQuery = rephrased.trim();
      if (searchQuery.toLowerCase() === "not_needed" || !searchQuery) {
        return { query: searchQuery, docs: [] as SearxngResult[] };
      }
      // no engines key — use searxng defaults
      const results = await searchSearxng(searchQuery, {});
      return {
        query: searchQuery,
        docs: results
          .map((r) => ({ ...r, content: r.content || r.title || "" }))
          .filter((r) => r.content)
          .slice(0, 8),
      };
    }),
  ]);
}

const retrieverChain = createBasicWebSearchRetrieverChain();

const answeringChain = RunnableSequence.from([
  RunnableMap.from({
    query: (input: { query: string; chat_history: BaseMessage[] }) => input.query,
    chat_history: (input: { query: string; chat_history: BaseMessage[] }) =>
      input.chat_history,
    context: RunnableSequence.from([
      (input: { query: string; chat_history: BaseMessage[] }) => ({
        query: input.query,
        chat_history: formatChatHistoryAsString(input.chat_history),
      }),
      retrieverChain,
      rerankDocs.withConfig({ runName: "FinalSourceRetriever" }),
      processDocs,
    ]),
  }),
  webResponsePrompt,
  getLLM(0.3),
  new StringOutputParser(),
]).withConfig({ runName: "FinalResponseGenerator" });

export function webSearchAgent(
  query: string,
  history: BaseMessage[],
  emitter: EventEmitter
): EventEmitter {
  (async () => {
    try {
      const stream = answeringChain.streamEvents(
        { query, chat_history: history },
        { version: "v2" }
      );
      await handleStream(stream, emitter);
    } catch (err) {
      emitter.emit("error", err);
    }
  })();
  return emitter;
}
