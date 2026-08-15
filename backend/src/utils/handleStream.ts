import { EventEmitter } from "events";
import type { StreamEvent } from "@langchain/core/tracers/log_stream";

function normalizeSource(source: any) {
  // Already in the frontend's expected SourceDocument format
  if (source?.metadata?.url) {
    return source;
  }

  // Convert raw SearXNG result into SourceDocument format
  return {
    pageContent: source?.content || "",
    metadata: {
      title: source?.title || "",
      url: source?.url || "",
      ...source,
    },
  };
}

// Shared across every streamed agent.
export async function handleStream(
  stream: AsyncGenerator<StreamEvent>,
  emitter: EventEmitter
) {
  for await (const event of stream) {
    if (
      event.event === "on_chain_end" &&
      event.name === "FinalSourceRetriever"
    ) {
      const rawSources = event.data.output || [];

      const sources = Array.isArray(rawSources)
        ? rawSources.map(normalizeSource)
        : [];

      emitter.emit(
        "data",
        JSON.stringify({
          type: "sources",
          data: sources,
        })
      );
    }

    if (
      event.event === "on_chain_stream" &&
      event.name === "FinalResponseGenerator"
    ) {
      emitter.emit(
        "data",
        JSON.stringify({
          type: "response",
          data: event.data.chunk,
        })
      );
    }

    if (
      event.event === "on_chain_end" &&
      event.name === "FinalResponseGenerator"
    ) {
      emitter.emit("end");
    }
  }
}