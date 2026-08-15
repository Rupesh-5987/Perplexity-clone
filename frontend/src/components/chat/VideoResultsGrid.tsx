import { useState } from "react";
import { Play, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getDomain, truncate } from "../../lib/utils";
import type { VideoResult } from "../../types";

interface Props {
  results: VideoResult[];
}

export default function VideoResultsGrid({ results }: Props) {
  const [active, setActive] = useState<VideoResult | null>(null);

  if (results.length === 0) {
    return <p className="text-sm text-text-tertiary">No videos found for this query.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {results.map((video, i) => (
          <button
            key={video.url + i}
            onClick={() => setActive(video)}
            className="group text-left rounded-xl overflow-hidden border border-border bg-surface hover:border-border-strong transition-colors"
          >
            <div className="relative aspect-video bg-surface-2 overflow-hidden">
              <img src={video.img_src} alt={video.title} loading="lazy" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center">
                  <Play size={16} className="text-black ml-0.5" fill="black" />
                </div>
              </div>
            </div>
            <div className="p-2.5">
              <p className="text-xs text-text-primary leading-snug line-clamp-2">
                {truncate(video.title, 70)}
              </p>
              <p className="text-[11px] text-text-tertiary mt-1">{getDomain(video.url)}</p>
            </div>
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
              className="fixed z-50 inset-4 md:inset-x-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[min(90vw,780px)] rounded-2xl border border-border bg-surface overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm text-text-primary truncate pr-3">{active.title}</p>
                <button
                  onClick={() => setActive(null)}
                  className="p-1 rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-hover shrink-0"
                  aria-label="Close video"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="aspect-video bg-black">
                <iframe
                  src={active.iframe_src}
                  title={active.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
