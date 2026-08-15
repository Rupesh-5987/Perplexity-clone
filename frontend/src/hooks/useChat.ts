import { useCallback, useRef, useState } from "react";
import { fetchNonStreaming, streamChat } from "../lib/api";
import type {
  ChatHistoryMessage,
  ChatRequestBody,
  ConversationTurn,
  FocusMode,
  ImageResult,
  Provider,
  VideoResult,
} from "../types";

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `turn_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function isNonStreamingMode(mode: FocusMode): boolean {
  return mode === "imageSearch" || mode === "videoSearch";
}

export function useChat() {
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const patchTurn = useCallback((id: string, patch: Partial<ConversationTurn>) => {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const appendAnswer = useCallback((id: string, chunk: string) => {
    setTurns((prev) =>
      prev.map((t) => (t.id === id ? { ...t, answer: t.answer + chunk } : t))
    );
  }, []);

  const buildHistory = useCallback((upToId?: string): ChatHistoryMessage[] => {
    const history: ChatHistoryMessage[] = [];
    for (const t of turns) {
      if (t.id === upToId) break;
      if (t.status === "streaming") continue;
      if (t.status === "error" && !t.answer) continue;
      history.push({ role: "user", content: t.query });
      if (t.answer) history.push({ role: "assistant", content: t.answer });
    }
    return history;
  }, [turns]);

  const submit = useCallback(
    async (query: string, focusMode: FocusMode, provider?: Provider) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      // cancel any in-flight stream before starting a new one
      abortRef.current?.abort();

      const id = newId();
      const chatHistory = buildHistory();

      const turn: ConversationTurn = {
        id,
        query: trimmed,
        focusMode,
        provider,
        status: "streaming",
        answer: "",
        sources: [],
        suggestions: [],
        imageResults: [],
        videoResults: [],
      };
      setTurns((prev) => [...prev, turn]);

      const body: ChatRequestBody = {
        query: trimmed,
        chatHistory,
        focusMode,
        ...(provider ? { provider } : {}),
      };

      if (isNonStreamingMode(focusMode)) {
        try {
          const res = await fetchNonStreaming<ImageResult | VideoResult>(body);
          if (!res.success) {
            patchTurn(id, { status: "error", error: "The search didn't return any results." });
            return;
          }
          patchTurn(id, {
            status: "done",
            suggestions: res.data.suggestions ?? [],
            ...(focusMode === "imageSearch"
              ? { imageResults: res.data.results as ImageResult[] }
              : { videoResults: res.data.results as VideoResult[] }),
          });
        } catch {
          patchTurn(id, {
            status: "error",
            error: "Something went wrong fetching results. Please try again.",
          });
        }
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;

      await streamChat(
        body,
        {
          onToken: (chunk) => appendAnswer(id, chunk),
          onSources: (sources) => patchTurn(id, { sources: sources ?? [] }),
          onSuggestions: (suggestions) => patchTurn(id, { suggestions: suggestions ?? [] }),
          onDone: () => patchTurn(id, { status: "done" }),
          onError: (message) => patchTurn(id, { status: "error", error: message }),
        },
        controller.signal
      );
    },
    [buildHistory, patchTurn, appendAnswer]
  );

  const retry = useCallback(
    (turnId: string) => {
      const turn = turns.find((t) => t.id === turnId);
      if (!turn) return;
      setTurns((prev) => prev.filter((t) => t.id !== turnId));
      submit(turn.query, turn.focusMode, turn.provider);
    },
    [turns, submit]
  );

  return { turns, submit, retry };
}
