import { EventEmitter } from "events";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { BaseMessage } from "@langchain/core/messages";
import { getLLM } from "../lib/groq.js";
import { handleStream } from "../utils/handleStream.js";

const writingAssistantPrompt = `You are a writing assistant. You do not perform web searches or have access to real-time information. Help the user draft, edit, and improve their writing. If you lack the information needed to help (e.g. the request needs current facts), say so directly and suggest the user switch to a search-enabled focus mode instead of guessing.`;

// No retrieval step, but still tagged FinalResponseGenerator and still
// streamed through the exact same eventEmitter + handleStream contract as
// Group A — so the frontend needs zero special-casing for this focus mode.
export function writingAssistantAgent(
  query: string,
  history: BaseMessage[],
  emitter: EventEmitter
): EventEmitter {
  const llm = getLLM(0.5);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", writingAssistantPrompt],
    new MessagesPlaceholder("chat_history"),
    ["human", "{query}"],
  ]);

  const chain = RunnableSequence.from([
    prompt,
    llm,
    new StringOutputParser(),
  ]).withConfig({ runName: "FinalResponseGenerator" });

  (async () => {
    try {
      const stream = chain.streamEvents(
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
