import axios from "axios";
import type { ChatRequestBody, NonStreamingResponse, StreamEvent } from "../types";

// Base URL is injected via env rather than hardcoded, per VITE_API_URL.
export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

type ExtractEvent<T extends string> = Extract<StreamEvent, {type: T}>;

export interface StreamHandlers {
  onToken?: (chunk: string) => void;
  onSources?: (sources: ExtractEvent<"sources">["data"]) => void;
  onSuggestions?: (suggestions: string[]) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

/**
 * Consumes the /api/chat SSE stream for the streaming focus modes.
 *
 * We can't use EventSource here because it only supports GET requests, and
 * this endpoint needs a POST body — so we read the response body manually
 * via fetch() + a ReadableStream reader, buffering partial lines across
 * chunk boundaries and parsing each `data: {...}` line as JSON.
 */
export async function streamChat(
  body: ChatRequestBody,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    handlers.onError?.("Could not reach the server. Check your connection and try again.");
    return;
  }

  if (!res.ok || !res.body) {
    handlers.onError?.(`Request failed (status ${res.status}).`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processLine = (rawLine: string): boolean => {
    // returns true if the stream should stop (done/error)
    const line = rawLine.trim();
    if (!line.startsWith("data:")) return false;
    const jsonStr = line.slice(5).trim();
    if (!jsonStr) return false;

    let event: StreamEvent;
    try {
      event = JSON.parse(jsonStr);
    } catch {
      return false; // ignore malformed/partial event
    }

    switch (event.type) {
      case "response":
        handlers.onToken?.(event.data);
        return false;
      case "sources":
        handlers.onSources?.(event.data);
        return false;
      case "suggestions":
        handlers.onSuggestions?.(event.data);
        return false;
      case "done":
        handlers.onDone?.();
        return true;
      case "error":
        handlers.onError?.(event.data);
        return true;
      default:
        return false;
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // last (possibly partial) line stays buffered

      for (const line of lines) {
        if (processLine(line)) return;
      }
    }
    // flush anything left in the buffer once the stream closes
    if (buffer.trim()) processLine(buffer);
    handlers.onDone?.();
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    handlers.onError?.("The connection was interrupted while streaming the answer.");
  }
}

/** Plain JSON call for imageSearch / videoSearch focus modes. */
export async function fetchNonStreaming<T>(
  body: ChatRequestBody,
  signal?: AbortSignal
): Promise<NonStreamingResponse<T>> {
  const res = await apiClient.post<NonStreamingResponse<T>>("/api/chat", body, { signal });
  return res.data;
}
