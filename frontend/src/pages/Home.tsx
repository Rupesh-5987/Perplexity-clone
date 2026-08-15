import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import SearchBar from "../components/search/SearchBar";
import type { FocusMode } from "../types";

const EXAMPLE_PROMPTS = [
  "Explain quantum entanglement simply",
  "Latest breakthroughs in fusion energy",
  "Compare React Server Components vs SSR",
];

export default function Home() {
  const [focusMode, setFocusMode] = useState<FocusMode>("webSearch");
  const navigate = useNavigate();

  function handleSubmit(query: string) {
    navigate("/search", { state: { initialQuery: query, focusMode } });
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <img
            src="/perplexed-logo.png"
            alt="Perplexed"
            className="w-11 h-11 object-contain mb-4"
          />
          <h1
            className="text-3xl md:text-4xl text-text-primary text-center"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Where knowledge begins
          </h1>
        </div>

        <SearchBar
          focusMode={focusMode}
          onFocusModeChange={setFocusMode}
          onSubmit={handleSubmit}
          size="large"
          autoFocus
        />

        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSubmit(prompt)}
              className="text-xs text-text-tertiary hover:text-text-secondary border border-border rounded-full px-3 py-1.5 hover:border-border-strong transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
