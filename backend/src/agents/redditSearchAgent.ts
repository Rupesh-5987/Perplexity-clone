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

const redditSearchRetrieverPrompt = PromptTemplate.fromTemplate(
  `You are an assistant that rewrites a user's question into a standalone search query aimed at finding relevant Reddit discussions, using the chat history for context. If the question is a greeting or needs no search, respond with exactly "not_needed".

Example:
Follow up question: What do people think about the new iPhone?
Rephrased: iPhone new release opinions reddit

Example:
Follow up question: Best budget laptops for students?
Rephrased: best budget laptop recommendations students

Example:
Follow up question: hi there
Rephrased: not_needed

Chat history:
{chat_history}

Follow up question: {query}
Rephrased:`
);

const redditResponsePrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are set to focus mode 'Reddit'. Summarize community opinions using ONLY the given context, retrieved by Reddit, citing sources inline as [1], [2]. Note where opinions differ.\n\nContext:\n{context}",
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{query}"],
]);

function createBasicRedditSearchRetrieverChain() {
  return RunnableSequence.from([
    redditSearchRetrieverPrompt,
    getLLM(0.3),
    new StringOutputParser(),
    RunnableLambda.from(async (rephrased: string) => {
      const searchQuery = rephrased.trim();
      if (searchQuery.toLowerCase() === "not_needed" || !searchQuery) {
        return { query: searchQuery, docs: [] as SearxngResult[] };
      }
      const results = await searchSearxng(searchQuery, {
        engines: ["reddit"],
      });
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

const retrieverChain = createBasicRedditSearchRetrieverChain();

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
  redditResponsePrompt,
  getLLM(0.3),
  new StringOutputParser(),
]).withConfig({ runName: "FinalResponseGenerator" });

export function redditSearchAgent(
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
