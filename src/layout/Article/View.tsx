import { motion, AnimatePresence } from "framer-motion";
import { ArticleDetail } from "@/components/ArticleView/Detail";
import { ScrollBox, ScrollBoxRefObject } from "@/components/ArticleView/ScrollBox";
import { useRef } from "react";
import { ReadingOptions } from "./ReadingOptions";
import { ToolbarItemNavigator } from "./ToolBar";
import { StarAndRead } from "@/layout/Article/StarAndRead";
import { PlayerSwitcher } from "@/components/PodcastPlayer/PlayerSwitch";
import { IconButton, Separator } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { ArticleResItem } from "@/db";
import { X } from "lucide-react";

export interface ArticleViewProps {
  article: ArticleResItem | null;
  goNext?: () => void;
  goPrev?: () => void;
  closable?: boolean;
  onClose?: () => void;
}

export function View(props: ArticleViewProps) {
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
        <h2 className="text-2xl font-medium text-[var(--gray-12)] mb-2">{t("Ready to Read")}</h2>
        <p className="text-[var(--gray-11)] text-base">{t("Select an article from your subscribe to start reading")}</p>
      </div>
    );
  };

  const scrollBoxRef = useRef<ScrollBoxRefObject>(null);

  return (
    <div className="flex-1">
      <div className={"h-[var(--app-toolbar-height)] flex items-center justify-end px-3 gap-2 border-b relative z-10"}>
        {props.article && (
          <>
            <StarAndRead article={props.article} />
            <Separator orientation={"vertical"} className="mx-1" />
          </>
        )}
        {props.goNext && props.goPrev && (
          <>
            <ToolbarItemNavigator goNext={props.goNext} goPrev={props.goPrev} />
            <Separator orientation="vertical" className="mx-1" />
          </>
        )}
        {props.article && (
          <>
            <ReadingOptions article={props.article} />
            <Separator orientation="vertical" className="mx-1" />
          </>
        )}

        <PlayerSwitcher />

        {props.closable && (
          <>
            <Separator orientation="vertical" className="mx-1" />
            <IconButton size="2" variant="ghost" color="gray" className="text-[var(--gray-12)]" onClick={props.onClose}>
              <X size={16} />
            </IconButton>
          </>
        )}
      </div>
      <AnimatePresence>
        <motion.article
          key={props.article?.uuid || "view"}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <ScrollBox className="h-[calc(100vh_-_var(--app-toolbar-height))]" ref={scrollBoxRef}>
            <div className="font-[var(--reading-font-body)] min-h-full m-auto sm:px-5 sm:max-w-xl lg:px-10 lg:max-w-5xl">
              {" "}
              {props.article ? <ArticleDetail article={props.article} /> : renderPlaceholder()}
            </div>
          </ScrollBox>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}
