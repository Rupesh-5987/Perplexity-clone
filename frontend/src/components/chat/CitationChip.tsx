import type { SourceDocument } from "../../types";

interface Props {
  index: number;
  source?: SourceDocument;
}

export default function CitationChip({ index, source }: Props) {
  if (!source) {
    // Citation number has no matching source (out of range) — render as plain text
    // rather than a dead link.
    return <sup className="text-text-tertiary">[{index}]</sup>;
  }

  return (
    <a
      href={source.metadata.url}
      target="_blank"
      rel="noopener noreferrer"
      title={source.metadata.title}
      className="citation-chip inline-flex items-center justify-center align-super mx-0.5 h-[15px] min-w-[15px] px-[3px] rounded-[4px] bg-surface-2 text-accent-light text-[10px] font-medium leading-none hover:bg-accent-dim hover:text-white transition-colors no-underline"
      style={{ fontSize: "10px" }}
    >
      {index}
    </a>
  );
}
