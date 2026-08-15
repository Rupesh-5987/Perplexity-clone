import { Plus } from "lucide-react";

interface Props {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export default function SuggestionChips({ suggestions, onSelect }: Props) {
  if (suggestions.length === 0) return null;

  return (
    <div className="mt-1">
      <p className="text-xs font-medium text-text-tertiary mb-2">Follow up</p>
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect(s)}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm text-text-primary hover:bg-surface-hover transition-colors"
          >
            <span>{s}</span>
            <Plus size={15} className="text-accent-light shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
