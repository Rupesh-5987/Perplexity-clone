import { useEffect, useRef, useState } from "react";
import { ArrowUp, Paperclip } from "lucide-react";
import FocusModeSelector from "./FocusModeSelector";
import type { FocusMode } from "../../types";

interface Props {
  focusMode: FocusMode;
  onFocusModeChange: (mode: FocusMode) => void;
  onSubmit: (query: string) => void;
  placeholder?: string;
  size?: "large" | "compact";
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function SearchBar({
  focusMode,
  onFocusModeChange,
  onSubmit,
  placeholder = "Ask anything...",
  size = "large",
  disabled = false,
  autoFocus = false,
}: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const isLarge = size === "large";

  return (
    <div
      className={`w-full rounded-2xl border border-border-strong bg-surface shadow-lg shadow-black/20 focus-within:border-accent-dim transition-colors ${
        isLarge ? "p-3" : "p-2.5"
      }`}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className={`w-full resize-none bg-transparent outline-none placeholder:text-text-tertiary text-text-primary ${
          isLarge ? "text-base min-h-[28px]" : "text-sm min-h-[22px]"
        }`}
      />

      <div className={`flex items-center justify-between ${isLarge ? "mt-2.5" : "mt-2"}`}>
        <div className="flex items-center gap-2">
          <FocusModeSelector value={focusMode} onChange={onFocusModeChange} compact={!isLarge} />
          {isLarge && (
            <button
              type="button"
              disabled
              title="Attach a file (not implemented)"
              className="flex items-center gap-1 rounded-full border border-border-strong px-2.5 py-1.5 text-xs text-text-tertiary opacity-50 cursor-not-allowed"
            >
              <Paperclip size={13} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          aria-label="Submit search"
          className={`flex items-center justify-center rounded-full transition-colors ${
            isLarge ? "w-9 h-9" : "w-7 h-7"
          } ${
            value.trim() && !disabled
              ? "bg-accent-light text-black hover:bg-white"
              : "bg-surface-2 text-text-tertiary cursor-not-allowed"
          }`}
        >
          <ArrowUp size={isLarge ? 18 : 15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
