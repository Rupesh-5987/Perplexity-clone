import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import SourceCard from "./SourceCard";
import type { SourceDocument } from "../../types";

interface Props {
  sources: SourceDocument[];
  open: boolean;
  onClose: () => void;
}

export default function SourcesModal({ sources, open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            role="dialog"
            aria-modal="true"
            className="fixed z-50 inset-x-4 top-[8vh] mx-auto max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-text-primary">
                Sources <span className="text-text-tertiary font-normal">({sources.length})</span>
              </h2>
              <button
                onClick={onClose}
                aria-label="Close sources"
                className="p-1 rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-hover"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sources.map((source, i) => (
                <SourceCard key={source.metadata.url + i} source={source} index={i + 1} variant="grid" />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
