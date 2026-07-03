import React, { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { Icon } from "../Icon";
import { Separator, Dialog } from "@radix-ui/themes";
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
): JSX.Element => {
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
    <Dialog.Root open={dialogStatus} onOpenChange={handleDialogChange}>
      {trigger && <Dialog.Trigger>{trigger}</Dialog.Trigger>}
      <Dialog.Content className="p-0 min-w-[960px] is-scroll">
        <ScrollBox className="h-[94vh]" ref={scrollBoxRef}>
          <>
            <div className="sticky left-0 right-0 top-0 z-[3]">
              <div className="flex items-center justify-between px-4 py-1.5 rounded-tl-lg rounded-tr-lg bg-[var(--gray-1)] border-b border-[var(--gray-4)]">
                <div className="flex items-center gap-0.5">
                  {article && (
                    <ReaderControls article={article} showBrowser showReadLater />
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <ReadingOptions article={article} />
                  <Separator orientation="vertical" className="h-4 mx-1" />
                  <Icon onClick={() => handleDialogChange(false)}>
                    <X size={16} />
                  </Icon>
                </div>
              </div>
            </div>
            <div className="relative px-20 py-10">
              {article ? <ArticleDetail article={article} /> : ""}
            </div>
            {/* </div> */}
          </>
        </ScrollBox>
      </Dialog.Content>
    </Dialog.Root>
  );
};
