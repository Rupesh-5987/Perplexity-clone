import { Request, Response } from "express";
import { EventEmitter } from "events";
import { toBaseMessages } from "../dispatch.js";
import { academicSearchAgent } from "../agents/academicSearchAgent.js";
import { redditSearchAgent } from "../agents/redditSearchAgent.js";
import { webSearchAgent } from "../agents/webSearchAgent.js";
import { youtubeSearchAgent } from "../agents/youtubeSearchAgent.js";
import { imageSearchAgent } from "../agents/imageSearchAgent.js";
import { videoSearchAgent } from "../agents/videoSearchAgent.js";
import { writingAssistantAgent } from "../agents/writingAssistantAgent.js";
import { suggestionGeneratorAgent } from "../agents/suggestionGeneratorAgent.js";

const streamedAgents: Record<string, Function> = {
  webSearch: webSearchAgent,
  academicSearch: academicSearchAgent,
  redditSearch: redditSearchAgent,
  youtubeSearch: youtubeSearchAgent,
  writingAssistant: writingAssistantAgent,
};

const listAgents: Record<string, Function> = {
  imageSearch: imageSearchAgent,
  videoSearch: videoSearchAgent,
};

export async function handleChat(req: Request, res: Response) {
  const { query, chatHistory = [], focusMode } = req.body || {};

  if (!query || !focusMode) {
    return res
      .status(400)
      .json({ success: false, error: "query and focusMode are required" });
  }

  const history = toBaseMessages(chatHistory);

  // Non-streaming modes: plain JSON
  if (listAgents[focusMode]) {
  try {
    const results = await listAgents[focusMode](query, history);

    return res.json({
      success: true,
      data: {
        results,
        suggestions: [],
      },
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({
        success: false,
        error: err?.message || "Search failed",
      });
  }
}

  if (!streamedAgents[focusMode]) {
    return res
      .status(400)
      .json({ success: false, error: `Unknown focusMode: ${focusMode}` });
  }

  // Streaming modes: SSE
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  res.socket?.setNoDelay(true);
  res.write(": connected\n\n");

  const emitter = new EventEmitter();

  emitter.on("data", (payload: string) => {
    res.write(`data: ${payload}\n\n`);
  });

  emitter.on("error", (err: any) => {
    res.write(
      `data: ${JSON.stringify({ type: "error", data: err?.message || "Unknown error" })}\n\n`
    );
    res.end();
  });

  emitter.on("end", async () => {
    // A suggestion-generator failure must never block "done" from firing.
    try {
      const suggestions = await suggestionGeneratorAgent(history);
      res.write(`data: ${JSON.stringify({ type: "suggestions", data: suggestions })}\n\n`);
    } catch (err) {
      // swallow — suggestions are best-effort
    }
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  });

  streamedAgents[focusMode](query, history, emitter);
}
