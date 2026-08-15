import { getDomain, getFaviconUrl, truncate } from "../../lib/utils";
import type { SourceDocument } from "../../types";

interface Props {
  source: SourceDocument;
  index: number;
  variant?: "row" | "grid";
}

export default function SourceCard({ source, index, variant = "row" }: Props) {
  const domain = getDomain(source.metadata.url);

  return (
    <a
      href={source.metadata.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex flex-col justify-between rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-border-strong transition-colors shrink-0 ${
        variant === "row" ? "w-52 h-[92px] p-3" : "w-full h-[104px] p-3"
      }`}
    >
      <p className="text-xs text-text-primary leading-snug line-clamp-2">
        {truncate(source.metadata.title || domain, 90)}
      </p>
      <div className="flex items-center gap-1.5 mt-2">
        <img
          src={getFaviconUrl(source.metadata.url)}
          alt=""
          className="w-3.5 h-3.5 rounded-sm shrink-0"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.visibility = "hidden";
          }}
        />
        <span className="text-[11px] text-text-tertiary truncate">{domain}</span>
        <span className="text-[11px] text-text-tertiary ml-auto shrink-0">{index}</span>
      </div>
    </a>
  );
}
