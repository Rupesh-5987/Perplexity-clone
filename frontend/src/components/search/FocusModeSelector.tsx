import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FOCUS_MODES, getFocusModeMeta } from "../../lib/utils";
import RedditGlyph from "./RedditGlyph";
import YoutubeGlyph from "./YoutubeGlyph";
import type { FocusMode } from "../../types";

interface Props {
  value: FocusMode;
  onChange: (mode: FocusMode) => void;
  /** compact = small pill used in the chat header once a thread has started */
  compact?: boolean;
}

function ModeIcon({ mode, size = 15 }: { mode: FocusMode; size?: number }) {
  if (mode === "redditSearch") return <RedditGlyph size={size} />;
  if (mode === "youtubeSearch") return <YoutubeGlyph size={size} />;
  const Icon = getFocusModeMeta(mode).icon;
  return <Icon size={size} strokeWidth={2} />;
}

export default function FocusModeSelector({ value, onChange, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = getFocusModeMeta(value);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () =>  { document.removeEventListener("mousedown", onClickOutside); };
  }, []);

  function handleToggle() {
    if (!open) {
      const rect = rootRef.current?.getBoundingClientRect();

      if (rect) {
        const menuHeight = 350;
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Open upward if there isn't enough room below
        // but there is enough room above.
        setDropUp(spaceBelow < menuHeight && spaceAbove > spaceBelow);
      }
    }

    setOpen((o) => !o);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full border border-border-strong text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors ${
          compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
        }`}
      >
        <span className="text-accent-light">
          <ModeIcon mode={value} size={compact ? 13 : 15} />
        </span>
        <span className="font-medium">{active.shortLabel}</span>
        <ChevronDown size={compact ? 12 : 14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{opacity: 0,y: dropUp ? 6 : -6,scale: 0.98,}}
            animate={{opacity: 1,y: 0,scale: 1,}}
            exit={{opacity: 0,y: dropUp ? 6 : -6,scale: 0.98,}}
            transition={{ duration: 0.14 }}
            role="listbox"
            className={`absolute z-30 w-64 rounded-xl border border-border bg-surface shadow-2xl shadow-black/50 p-1.5 ${
              dropUp
                ? "bottom-full mb-2"
                : "top-full mt-2"
            }`}
          >
            {FOCUS_MODES.map((mode) => (
              <button
                key={mode.id}
                role="option"
                aria-selected={mode.id === value}
                onClick={() => {
                  onChange(mode.id);
                  setOpen(false);
                }}
                className={`w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  mode.id === value ? "bg-surface-hover" : "hover:bg-surface-hover"
                }`}
              >
                <span className="mt-0.5 text-accent-light shrink-0">
                  <ModeIcon mode={mode.id} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-text-primary">{mode.label}</span>
                  <span className="block text-xs text-text-tertiary">{mode.description}</span>
                </span>
                {mode.id === value && <Check size={15} className="mt-0.5 text-accent-light shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
