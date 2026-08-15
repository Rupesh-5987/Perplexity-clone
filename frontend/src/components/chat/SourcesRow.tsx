import { useState } from "react";
import { Layers } from "lucide-react";
import SourceCard from "./SourceCard";
import SourcesModal from "./SourcesModal";
import type { SourceDocument } from "../../types";

interface Props {
  sources: SourceDocument[];
}

const VISIBLE_COUNT = 5;

export default function SourcesRow({ sources }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  if (sources.length === 0) return null;

  const visible = sources.slice(0, VISIBLE_COUNT);
  const remaining = sources.length - visible.length;

  return (
    <div className="mb-1">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-text-tertiary">
        <Layers size={13} />
        <span>Sources</span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
        {visible.map((source, i) => (
          <SourceCard key={source.metadata.url + i} source={source} index={i + 1} />
        ))}
        {sources.length > 0 && (
          <button
            onClick={() => setModalOpen(true)}
            className="shrink-0 w-32 h-[92px] rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-border-strong transition-colors flex flex-col items-center justify-center gap-1"
          >
            <span className="text-sm font-semibold text-text-primary">
              {remaining > 0 ? `+${remaining}` : sources.length}
            </span>
            <span className="text-[11px] text-text-tertiary">View all</span>
          </button>
        )}
      </div>
      <SourcesModal sources={sources} open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
