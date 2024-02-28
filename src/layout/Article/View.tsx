import { motion, AnimatePresence } from "framer-motion";
import { ArticleDetail } from "@/components/ArticleView/Detail";
import { ScrollBox, ScrollBoxRefObject } from "@/components/ArticleView/ScrollBox";
import { useBearStore } from "@/stores";
import { useEffect, useRef } from "react";
import { ReadingOptions } from "./ReadingOptions";
import { Separator } from "@/components/ui/separator";
import { ToolbarItemNavigator } from "./ToolBar";
import { StarAndRead } from "@/layout/Article/StarAndRead";
import { PlayerSwitcher } from "@/components/PodcastPlayer/PlayerSwitch";

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

  const renderPlaceholder = () => {
    return (
      <div className="py-10 text-xl">
        <p>Let's read something</p>
      </div>
    );
  };

  const scrollBoxRef = useRef<ScrollBoxRefObject>(null);

  return (
    <div className="flex-1">
      <div
        className={
          "h-[var(--app-toolbar-height)] flex items-center justify-end px-2 space-x-0.5 border-b relative z-10"
        }
      >
        {store.article && <StarAndRead article={store.article} />}
        <Separator orientation={"vertical"} className={"h-4 mx-2"} />
        <ToolbarItemNavigator goNext={props.goNext} goPrev={props.goPrev} />
        <span>
          <Separator orientation="vertical" className="h-4 mx-2" />
        </span>
        <ReadingOptions />
        <Separator orientation="vertical" className="h-4 mx-2" />
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
