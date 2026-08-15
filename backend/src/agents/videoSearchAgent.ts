import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { BaseMessage } from "@langchain/core/messages";
import { getLLM } from "../lib/groq.js";
import { searchSearxng } from "../services/searxng.js";
import { formatChatHistoryAsString } from "../utils/formatHistory.js";

const videoSearchChainPrompt = PromptTemplate.fromTemplate(
  `You are an assistant that rewrites a user's question into a standalone video search query, using the chat history for context.

Example:
Follow up question: Show me a tutorial on knitting
Rephrased: knitting tutorial for beginners

Example:
Follow up question: What does the aurora borealis look like?
Rephrased: aurora borealis footage

Chat history:
{chat_history}

Follow up question: {query}
Rephrased:`
);

// No "not_needed" branch — every follow-up gets searched (section 2.2),
// consistent with imageSearchAgent.
const videoSearchChain = RunnableSequence.from([
  videoSearchChainPrompt,
  getLLM(0.3),
  new StringOutputParser(),
  RunnableLambda.from(async (searchQuery: string) => {
    const results = await searchSearxng(searchQuery.trim(), {
      engines: ["youtube"],
    });
    return results
      .filter((r) => r.thumbnail && r.url && r.title && r.iframe_src)
      .slice(0, 10)
      .map((r) => ({
        img_src: r.thumbnail!, // frontend expects img_src consistently across image/video
        url: r.url,
        title: r.title,
        iframe_src: r.iframe_src!,
      }));
  }),
]);

export async function handleVideoSearch(query: string, history: BaseMessage[]) {
  return videoSearchChain.invoke({
    query,
    chat_history: formatChatHistoryAsString(history),
  });
}

export { handleVideoSearch as videoSearchAgent };
