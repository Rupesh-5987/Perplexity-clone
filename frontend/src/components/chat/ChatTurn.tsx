import { motion } from "framer-motion";
import QueryBubble from "./QueryBubble";
import AnswerDisplay from "./AnswerDisplay";
import SourcesRow from "./SourcesRow";
import SuggestionChips from "./SuggestionChips";
import LoadingSkeleton from "./LoadingSkeleton";
import ErrorMessage from "./ErrorMessage";
import ImageResultsGrid from "./ImageResultsGrid";
import VideoResultsGrid from "./VideoResultsGrid";
import RedditGlyph from "../search/RedditGlyph";
import YoutubeGlyph from "../search/YoutubeGlyph";
import { getFocusModeMeta } from "../../lib/utils";
import type { ConversationTurn } from "../../types";

interface Props {
  turn: ConversationTurn;
  onSuggestionSelect: (suggestion: string) => void;
  onRetry: (turnId: string) => void;
}

export default function ChatTurn({ turn, onSuggestionSelect, onRetry }: Props) {
  const meta = getFocusModeMeta(turn.focusMode);
  const Icon = meta.icon;
  const isMedia = turn.focusMode === "imageSearch" || turn.focusMode === "videoSearch";
  const hasFirstToken = turn.answer.length > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="py-6 border-b border-border last:border-b-0"
    >
      <QueryBubble query={turn.query} />

      <div className="flex items-center gap-1.5 mt-3 mb-4 text-xs font-medium text-text-tertiary">
        {turn.focusMode === "redditSearch" ? (
          <RedditGlyph size={13} />
        ) : turn.focusMode === "youtubeSearch" ? (
          <YoutubeGlyph size={13} />
        ) : (
          <Icon size={13} />
        )}
        <span>{meta.label}</span>
      </div>

      {turn.status === "error" ? (
        <ErrorMessage message={turn.error ?? "Something went wrong."} onRetry={() => onRetry(turn.id)} />
      ) : isMedia ? (
        turn.status === "streaming" ? (
          <LoadingSkeleton />
        ) : turn.focusMode === "imageSearch" ? (
          <ImageResultsGrid results={turn.imageResults} />
        ) : (
          <VideoResultsGrid results={turn.videoResults} />
        )
      ) : (
        <div className="space-y-4">
          {turn.sources.length > 0 && <SourcesRow sources={turn.sources} />}
          {!hasFirstToken && turn.status === "streaming" ? (
            <LoadingSkeleton />
          ) : (
            <AnswerDisplay
              content={turn.answer}
              sources={turn.sources}
              isStreaming={turn.status === "streaming"}
            />
          )}
        </div>
      )}

      {turn.status === "done" && turn.suggestions.length > 0 && (
        <div className="mt-5">
          <SuggestionChips suggestions={turn.suggestions} onSelect={onSuggestionSelect} />
        </div>
      )}
    </motion.section>
  );
}
