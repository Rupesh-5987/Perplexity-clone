import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export function toBaseMessages(history: Message[] = []): BaseMessage[] {
  return history.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
  );
}
