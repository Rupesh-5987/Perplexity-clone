import { BaseMessage } from "@langchain/core/messages";

export function formatChatHistoryAsString(history: BaseMessage[]): string {
  if (history.length === 0) return "No previous messages.";
  return history.map((m) => `${m._getType()}: ${m.content}`).join("\n");
}
