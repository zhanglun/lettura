import React, { useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Dialog } from "@astryxdesign/core/Dialog";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Divider } from "@astryxdesign/core/Divider";
import { ReadingOptions } from "@/layout/Article/ReadingOptions";
import { ReaderControls } from "@/components/ReaderControls";
import { ArticleDetail } from "@/components/ArticleView/Detail";
import { ScrollBox, ScrollBoxRefObject } from "./ScrollBox";

type ArticleDialogViewProps = {
  article: any | null;
  dialogStatus: boolean;
  trigger?: React.ReactNode;
  setDialogStatus: (status: boolean) => void;
  afterConfirm: () => void;
  afterCancel: () => void;
};

export const ArticleDialogView = (
  props: ArticleDialogViewProps,
): React.ReactElement => {
  const { t } = useTranslation();
  const {
    article,
    dialogStatus,
    setDialogStatus,
    afterConfirm,
    afterCancel,
    trigger,
  } = props;

  const scrollBoxRef = useRef<ScrollBoxRefObject>(null);
  const handleDialogChange = useCallback((status: boolean) => {
    setDialogStatus(status);

    if (!status) {
      afterCancel();
    }
  }, [setDialogStatus, afterCancel]);

  useEffect(() => {
    scrollBoxRef.current?.scrollToTop();
  }, [article]);

  return (
    <>
      {trigger}
      <Dialog
        isOpen={dialogStatus}
        onOpenChange={handleDialogChange}
        width={960}
        padding={0}
        maxHeight="94vh"
      >
        <ScrollBox className="h-[94vh]" ref={scrollBoxRef}>
          <>
            <div className="sticky left-0 right-0 top-0 z-[3]">
              <div className="flex items-center justify-between px-4 py-1.5 rounded-tl-lg rounded-tr-lg bg-[var(--color-background-muted)] border-b border-[var(--color-border)]">
                <div className="flex items-center gap-0.5">
                  {article && (
                    <ReaderControls article={article} showBrowser showReadLater />
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <ReadingOptions article={article} />
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
          </>
        </ScrollBox>
      </Dialog>
    </>
  );
};
