import { useEffect, useRef } from "react";
import ChatTurn from "./ChatTurn";
import type { ConversationTurn } from "../../types";

interface Props {
  turns: ConversationTurn[];
  onSuggestionSelect: (suggestion: string) => void;
  onRetry: (turnId: string) => void;
}

export default function ChatThread({ turns, onSuggestionSelect, onRetry }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTurnId = turns[turns.length - 1]?.id;

  // Scroll to the newest turn when a query is submitted, not on every token.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTurnId]);

  return (
    <div className="flex flex-col">
      {turns.map((turn, i) => (
        <div key={turn.id} ref={i === turns.length - 1 ? bottomRef : undefined}>
          <ChatTurn turn={turn} onSuggestionSelect={onSuggestionSelect} onRetry={onRetry} />
        </div>
      ))}
    </div>
  );
}
