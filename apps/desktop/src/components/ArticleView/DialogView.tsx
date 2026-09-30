import { Dialog } from "@astryxdesign/core/Dialog";
import { Divider } from "@astryxdesign/core/Divider";
import { IconButton } from "@astryxdesign/core/IconButton";
import { X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArticleDetail } from "@/components/ArticleView/Detail";
import { ReaderControls } from "@/components/ReaderControls";
import { ReadingOptions } from "@/layout/Article/ReadingOptions";
import { useBearStore } from "@/stores";
import { ScrollBox, type ScrollBoxRefObject } from "./ScrollBox";

/**
 * 面板内文章浮层（确认弹窗）。数据自读 store：article/articleDialogViewStatus
 * 只有这里和 ArticleView 的详情分支关心，之前经 props 透传的两处调用传的
 * 完全相同——收进组件内，调用方一行即可。
 */
export const ArticleDialogView = (): React.ReactElement => {
  const { t } = useTranslation();
  const article = useBearStore((state) => state.article);
  const dialogStatus = useBearStore((state) => state.articleDialogViewStatus);
  const setArticleDialogViewStatus = useBearStore(
    (state) => state.setArticleDialogViewStatus,
  );
  const setArticle = useBearStore((state) => state.setArticle);

  const scrollBoxRef = useRef<ScrollBoxRefObject>(null);
  const handleDialogChange = useCallback(
    (status: boolean) => {
      setArticleDialogViewStatus(status);

      if (!status) {
        setArticle(null);
      }
    },
    [setArticleDialogViewStatus, setArticle],
  );

  // article 变化即回滚顶：依赖本身不进 effect 体，属「重置型」effect，非误用
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset-style effect, dep is the trigger not the data
  useEffect(() => {
    scrollBoxRef.current?.scrollToTop();
  }, [article]);

  return (
    <Dialog
      isOpen={dialogStatus}
      onOpenChange={handleDialogChange}
      width={960}
      padding={0}
      maxHeight="94vh"
    >
      <ScrollBox className="h-[94vh]" ref={scrollBoxRef}>
        <div className="sticky left-0 right-0 top-0 z-[3]">
          <div className="flex items-center justify-between px-4 py-1.5 rounded-tl-lg rounded-tr-lg bg-[var(--color-background-muted)] border-b border-[var(--color-border)]">
            <div className="flex items-center gap-0.5">
              {article && (
                <ReaderControls article={article} showBrowser showReadLater />
              )}
            </div>
            <div className="flex items-center gap-0.5">
              {article && <ReadingOptions article={article} />}
              <Divider
                orientation="vertical"
                style={{ height: 16, marginInline: 4 }}
              />
              <IconButton
                size="sm"
                variant="ghost"
                label={t("Close")}
                onClick={() => handleDialogChange(false)}
                icon={<X size={16} />}
              />
            </div>
          </div>
        </div>
        <div className="relative px-20 py-10">
          {article ? <ArticleDetail article={article} /> : ""}
        </div>
      </ScrollBox>
    </Dialog>
  );
};
