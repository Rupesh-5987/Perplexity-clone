import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { BaseMessage } from "@langchain/core/messages";
import { getLLM } from "../lib/groq.js";
import { searchSearxng } from "../services/searxng.js";
import { formatChatHistoryAsString } from "../utils/formatHistory.js";

const imageSearchChainPrompt = PromptTemplate.fromTemplate(
  `You are an assistant that rewrites a user's question into a standalone image search query, using the chat history for context.

Example:
Follow up question: Show me pictures of the Eiffel Tower
Rephrased: Eiffel Tower Paris

Example:
Follow up question: What does a red panda look like?
Rephrased: red panda animal

Chat history:
{chat_history}

Follow up question: {query}
Rephrased:`
);

// No "not_needed" branch — every follow-up gets searched (section 2.2).
const imageSearchChain = RunnableSequence.from([
  imageSearchChainPrompt,
  getLLM(0.3),
  new StringOutputParser(),
  RunnableLambda.from(async (searchQuery: string) => {
    const results = await searchSearxng(searchQuery.trim(), {
      categories: ["images"],
      engines: ["bing images", "google images"],
    });
    return results
      .filter((r) => r.img_src && r.url && r.title)
      .slice(0, 10)
      .map((r) => ({ img_src: r.img_src!, url: r.url, title: r.title }));
  }),
]);

export async function handleImageSearch(query: string, history: BaseMessage[]) {
  return imageSearchChain.invoke({
    query,
    chat_history: formatChatHistoryAsString(history),
  });
}

export { handleImageSearch as imageSearchAgent };
