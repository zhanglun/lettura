import { AnimatePresence, motion } from "framer-motion";
import { ArticleResItem } from "@/db";
import { View } from "./View";

interface ArticleReaderDrawerProps {
  article: ArticleResItem | null;
  open: boolean;
  goNext?: () => void;
  goPrev?: () => void;
  onClose: () => void;
}

export function ArticleReaderDrawer(props: ArticleReaderDrawerProps) {
  const { article, open, goNext, goPrev, onClose } = props;

  return (
    <AnimatePresence initial={false}>
      {open && article && (
        <motion.aside
          key="article-reader-drawer"
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 48 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="h-full min-w-0 shrink-0 overflow-hidden border-l border-[var(--gray-4)] bg-[var(--color-panel-solid)] shadow-level-2-left"
          style={{ width: "min(960px, 70vw)" }}
        >
          <View
            article={article}
            goNext={goNext}
            goPrev={goPrev}
            closable={true}
            onClose={onClose}
          />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
