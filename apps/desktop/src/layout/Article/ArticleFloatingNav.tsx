import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ArticleFloatingNavProps {
  visible: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function ArticleFloatingNav({
  visible,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: ArticleFloatingNavProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="floating-nav"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 flex flex-col gap-2"
        >
          <button
            onClick={onPrev}
            disabled={!canPrev}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--gray-4)] bg-[var(--color-panel-solid)] text-[var(--gray-11)] shadow-level-1 transition-all hover:bg-[var(--gray-2)] hover:text-[var(--gray-12)] hover:border-[var(--gray-6)] disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronUp size={18} />
          </button>
          <button
            onClick={onNext}
            disabled={!canNext}
            className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--accent-9)] bg-[var(--accent-9)] text-white shadow-level-1 transition-all hover:bg-[var(--accent-11)] hover:border-[var(--accent-11)] disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronDown size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
