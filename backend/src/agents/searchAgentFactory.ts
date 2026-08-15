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
import { getEmbeddings } from "../lib/gemini.js";
import { searchSearxng, SearxngResult } from "../services/searxng.js";
import { cosineSimilarity } from "../utils/computeSimilarity.js";
import { handleStream } from "../utils/handleStream.js";
import { formatChatHistoryAsString } from "../utils/formatHistory.js";

export interface SearchAgentConfig {
  engines?: string[];
  categories?: string[];
  retrieverPromptTemplate: string; // PromptTemplate, must include {chat_history} and {query}
  responseSystemPrompt: string; // ChatPromptTemplate system message
}

// Group A anatomy: retriever chain (rephrase -> search, with "not_needed"
// escape hatch) -> rerankDocs -> processDocs -> answering chain, tagged for
// streamEvents() to pick apart sources vs response.
export function createSearchAgent(config: SearchAgentConfig) {
  const llm = getLLM(0.3);

  // 1. Retriever chain: rephrase query, then search (or bail on not_needed)
  const retrieverPrompt = PromptTemplate.fromTemplate(config.retrieverPromptTemplate);

  // Expects { query, chat_history } where chat_history is already a string —
  // PromptTemplate (text, not chat) can't interpolate a BaseMessage[] directly.
  const retrieverChain = RunnableSequence.from([
    retrieverPrompt,
    llm,
    new StringOutputParser(),
    RunnableLambda.from(async (rephrased: string) => {
      const searchQuery = rephrased.trim();
      if (searchQuery.toLowerCase() === "not_needed" || !searchQuery) {
        return { query: searchQuery, docs: [] as SearxngResult[] };
      }
      const results = await searchSearxng(searchQuery, {
        engines: config.engines,
        categories: config.categories,
      });
      return {
        query: searchQuery,
        docs: results.filter((r) => r.content).slice(0, 8),
      };
    }),
  ]);

  // 2. Rerank: embed docs + query in parallel, cosine similarity, >0.5,
  //    sort DESCENDING (most similar first), slice top 15.
  const rerankDocs = RunnableLambda.from(
    async (input: { query: string; docs: SearxngResult[] }) => {
      if (input.docs.length === 0) return [];
      const embeddings = getEmbeddings();
      const [queryEmbedding, docEmbeddings] = await Promise.all([
        embeddings.embedQuery(input.query),
        embeddings.embedDocuments(input.docs.map((d) => d.content || "")),
      ]);

      return input.docs
        .map((doc, i) => ({
          doc,
          score: cosineSimilarity(queryEmbedding, docEmbeddings[i]),
        }))
        .filter((r) => r.score > 0.5)
        .sort((a, b) => b.score - a.score) // descending — most similar first
        .slice(0, 15)
        .map((r) => r.doc);
    }
  );

  // 3. Format reranked docs into numbered context string
  const processDocs = RunnableLambda.from((docs: SearxngResult[]) => {
    if (docs.length === 0) return "No relevant sources were found.";
    return docs.map((d, i) => `${i + 1}. ${d.title}\n${d.content}\nURL: ${d.url}`).join("\n\n");
  });

  const responsePrompt = ChatPromptTemplate.fromMessages([
    ["system", config.responseSystemPrompt],
    new MessagesPlaceholder("chat_history"),
    ["human", "{query}"],
  ]);

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
    responsePrompt,
    llm,
    new StringOutputParser(),
  ]).withConfig({ runName: "FinalResponseGenerator" });

  return function run(
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
  };
}
