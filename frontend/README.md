# Perplexed — Perplexity-clone frontend

React 19 + TypeScript + Vite + Tailwind v4 frontend for the Perplexity-clone backend.

## Setup

```bash
npm install
cp .env.example .env   # then edit VITE_API_URL if your backend isn't on localhost:3000
npm run dev
```

## Structure

- `src/types` — types mirroring the backend API contract exactly
- `src/lib/api.ts` — SSE stream parser (fetch + ReadableStream) for streaming focus
  modes, plain axios call for imageSearch/videoSearch
- `src/lib/utils.ts` — focus mode metadata, favicon/domain helpers
- `src/hooks/useChat.ts` — owns the conversation state (array of turns), dispatches
  to streaming or non-streaming based on focus mode, builds chatHistory for each
  new request
- `src/components/search` — SearchBar, FocusModeSelector (+ Reddit/YouTube glyphs,
  since this lucide-react version dropped brand icons)
- `src/components/chat` — QueryBubble, AnswerDisplay (markdown + inline citation
  chips + syntax-highlighted code), SourceCard/SourcesRow/SourcesModal,
  SuggestionChips, ImageResultsGrid, VideoResultsGrid, ChatTurn, ChatThread,
  LoadingSkeleton, ErrorMessage
- `src/pages` — `Home` (landing search) and `SearchPage` (chat thread), connected
  via react-router-dom; the first query is passed through router state

## Notable implementation choices

- **Citations**: the backend streams raw markdown with `[1]`, `[2]` markers in
  the text. `AnswerDisplay` rewrites those into `[1](citation:1)` links (skipping
  fenced code blocks) and a custom react-markdown `a` renderer turns
  `citation:N` hrefs into numbered `<CitationChip>` components linking to
  `sources[N-1]`.
- **Streaming**: `EventSource` can't send a POST body, so `streamChat()` in
  `lib/api.ts` reads the response body manually via
  `fetch().body.getReader()`, buffering partial lines across chunk boundaries
  and parsing each `data: {...}` line as JSON.
- **Chat history**: `useChat` reduces completed turns into the
  `{role, content}[]` shape on every submit, skipping turns that are still
  streaming or that errored out with no answer (so a retry doesn't duplicate
  the query in history).
