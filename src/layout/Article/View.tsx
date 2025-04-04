import { motion, AnimatePresence } from "framer-motion";
import { ArticleDetail } from "@/components/ArticleView/Detail";
import { ScrollBox, ScrollBoxRefObject } from "@/components/ArticleView/ScrollBox";
import { useBearStore } from "@/stores";
import { useEffect, useRef } from "react";
import { ReadingOptions } from "./ReadingOptions";
import { ToolbarItemNavigator } from "./ToolBar";
import { StarAndRead } from "@/layout/Article/StarAndRead";
import { PlayerSwitcher } from "@/components/PodcastPlayer/PlayerSwitch";
import { Separator } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

export interface ArticleViewProps {
  goNext: () => void;
  goPrev: () => void;
}

export function View(props: ArticleViewProps) {
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    feed: state.feed,
    article: state.article,
  }));
  const { t } = useTranslation();

  const renderPlaceholder = () => {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-6">
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--gray-6)]"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-medium text-[var(--gray-12)] mb-2">
          {t("Ready to Read")}
        </h2>
        <p className="text-[var(--gray-11)] text-base">
          {t("Select an article from your subscribe to start reading")}
        </p>
      </div>
    );
  };

  const scrollBoxRef = useRef<ScrollBoxRefObject>(null);

  return (
    <div className="flex-1">
      <div
        className={"h-[var(--app-toolbar-height)] flex items-center justify-end px-2 space-x-2 border-b relative z-10"}
      >
        {store.article && <StarAndRead article={store.article} />}
        <Separator orientation={"vertical"} className={"h-4"} />
        <ToolbarItemNavigator goNext={props.goNext} goPrev={props.goPrev} />
        <Separator orientation="vertical" className="h-4" />
        <ReadingOptions />
        <Separator orientation="vertical" className="h-4" />
        <PlayerSwitcher />
      </div>
      <AnimatePresence>
        <motion.article
          key={store.article?.uuid || "view"}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <ScrollBox className="h-[calc(100vh_-_var(--app-toolbar-height))]" ref={scrollBoxRef}>
            <div className="font-[var(--reading-font-body)] min-h-full m-auto sm:px-5 sm:max-w-xl lg:px-10 lg:max-w-5xl">
              {" "}
              {store.article ? <ArticleDetail article={store.article} /> : renderPlaceholder()}
            </div>
          </ScrollBox>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}
