import { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getDomain } from "../../lib/utils";
import type { ImageResult } from "../../types";

interface Props {
  results: ImageResult[];
}

export default function ImageResultsGrid({ results }: Props) {
  const [active, setActive] = useState<ImageResult | null>(null);

  if (results.length === 0) {
    return <p className="text-sm text-text-tertiary">No images found for this query.</p>;
  }

  return (
    <>
      <div className="columns-2 sm:columns-3 md:columns-4 gap-2.5 [&>*]:mb-2.5">
        {results.map((img, i) => (
          <button
            key={img.url + i}
            onClick={() => setActive(img)}
            className="block w-full rounded-xl overflow-hidden border border-border bg-surface hover:border-border-strong transition-colors break-inside-avoid"
          >
            <img src={img.img_src} alt={img.title} loading="lazy" className="w-full h-auto block" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/80"
              onClick={() => setActive(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="fixed z-50 inset-4 md:inset-x-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[min(90vw,720px)] md:max-h-[85vh] rounded-2xl border border-border bg-surface overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm text-text-primary truncate pr-3">{active.title}</p>
                <button
                  onClick={() => setActive(null)}
                  className="p-1 rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-hover shrink-0"
                  aria-label="Close image"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-auto flex items-center justify-center bg-black/30 p-2">
                <img src={active.img_src} alt={active.title} className="max-h-[65vh] w-auto object-contain" />
              </div>
              <a
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-3 border-t border-border text-xs text-accent-light hover:text-white transition-colors"
              >
                <ExternalLink size={13} />
                {getDomain(active.url)}
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
