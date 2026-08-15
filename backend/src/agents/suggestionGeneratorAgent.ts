import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { getLLM } from "../lib/groq.js";
import { formatChatHistoryAsString } from "../utils/formatHistory.js";
import { ListLineOutputParser } from "../lib/outputParsers/listLineOutputParser.js";

const suggestionGeneratorPrompt = PromptTemplate.fromTemplate(
  `Based on the chat history below, generate 4-5 relevant, medium-length follow-up questions the user might want to ask next. Respond with ONLY the following, nothing else:
<suggestions>
question one
question two
</suggestions>

Chat history:
{chat_history}`
);

// Breaks the streamed-agent pattern on purpose: chat_history only (no query),
// custom ListLineOutputParser instead of StringOutputParser, plain .invoke(),
// not wired through handleStream.
export async function suggestionGeneratorAgent(
  history: BaseMessage[]
): Promise<string[]> {
  const llm = getLLM();
  // Force temperature 0 by mutating the instance directly — deterministic
  // suggestions matter more here than varying the call signature.
  llm.temperature = 0;

  const outputParser = new ListLineOutputParser({ key: "suggestions" });

  const chain = RunnableSequence.from([
    suggestionGeneratorPrompt,
    llm,
    outputParser,
  ]);

  return chain.invoke({ chat_history: formatChatHistoryAsString(history) });
}
