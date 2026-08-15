import {
  RunnableSequence,
  RunnableLambda,
} from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { BaseMessage } from "@langchain/core/messages";
import { getLLM } from "../lib/groq.js";
import { searchSearxng, SearxngResult } from "../services/searxng.js";
import { formatChatHistoryAsString } from "../utils/formatHistory.js";

export interface ListAgentConfig {
  engines?: string[];
  categories?: string[];
  retrieverPromptTemplate: string; // must include {chat_history} and {query}
  shape: (r: SearxngResult) => Record<string, string> | null;
}

// Group B anatomy: rephrase -> search -> shape. Plain .invoke(), no
// streaming, no reranking, and deliberately NO "not_needed" branch —
// every query gets searched here per spec.
export function createListAgent(config: ListAgentConfig) {
  const llm = getLLM(0.3);

  const retrieverPrompt = PromptTemplate.fromTemplate(config.retrieverPromptTemplate);

  const chain = RunnableSequence.from([
    retrieverPrompt,
    llm,
    new StringOutputParser(),
    RunnableLambda.from(async (searchQuery: string) => {
      const results = await searchSearxng(searchQuery.trim(), {
        engines: config.engines,
        categories: config.categories,
      });
      return results
        .map(config.shape)
        .filter((r): r is Record<string, string> => r !== null)
        .slice(0, 10);
    }),
  ]);

  return async function run(query: string, history: BaseMessage[]) {
    return chain.invoke({
      query,
      chat_history: formatChatHistoryAsString(history),
    });
  };
}
