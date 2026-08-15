// Types mirroring the backend API contract exactly. Do not change shapes
// here without changing the backend — the frontend trusts this contract.

export type FocusMode =
  | "webSearch"
  | "academicSearch"
  | "redditSearch"
  | "youtubeSearch"
  | "imageSearch"
  | "videoSearch"
  | "writingAssistant";

export type Provider = "groq" | "gemini";

export const STREAMING_MODES: FocusMode[] = [
  "webSearch",
  "academicSearch",
  "redditSearch",
  "youtubeSearch",
  "writingAssistant",
];

export const NON_STREAMING_MODES: FocusMode[] = ["imageSearch", "videoSearch"];

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SourceDocument {
  pageContent: string;
  metadata: {
    title: string;
    url: string;
    [key: string]: unknown;
  };
}

export interface ImageResult {
  img_src: string;
  url: string;
  title: string;
}

export interface VideoResult {
  img_src: string;
  url: string;
  title: string;
  iframe_src: string;
}

export interface ChatRequestBody {
  query: string;
  chatHistory: ChatHistoryMessage[];
  focusMode: FocusMode;
  provider?: Provider;
}

// Discriminated union of every SSE event the backend can emit.
export type StreamEvent =
  | { type: "response"; data: string }
  | { type: "sources"; data: SourceDocument[] }
  | { type: "suggestions"; data: string[] }
  | { type: "done" }
  | { type: "error"; data: string };

export interface NonStreamingResponse<T> {
  success: boolean;
  data: {
    results: T[];
    suggestions: string[];
  };
}

// One user query + its answer in the conversation thread. This is a
// frontend-only concept — the backend just sees query/chatHistory/focusMode.
export interface ConversationTurn {
  id: string;
  query: string;
  focusMode: FocusMode;
  provider?: Provider;
  status: "streaming" | "done" | "error";
  answer: string;
  sources: SourceDocument[];
  suggestions: string[];
  imageResults: ImageResult[];
  videoResults: VideoResult[];
  error?: string;
}
