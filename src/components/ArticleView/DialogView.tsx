import React, { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { ToolbarItemNavigator } from "@/layout/Article/ToolBar";
import { Icon } from "../Icon";
import { Separator } from "@/components/ui/separator";
import { ReadingOptions } from "@/layout/Article/ReadingOptions";
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
  const handleDialogChange = (status: boolean) => {
    setDialogStatus(status);

    if (!status) {
      afterCancel();
    }
  };

  useEffect(() => {
    scrollBoxRef.current?.scrollToTop();
  }, [article]);

  return (
    <Dialog open={ dialogStatus } onOpenChange={ handleDialogChange }>
      { trigger && <DialogTrigger>{ trigger }</DialogTrigger> }
      <DialogContent className="p-0 min-w-[960px] is-scroll">
        <ScrollBox className="h-[94vh]" ref={scrollBoxRef}>
          <>
            <div className="sticky left-0 right-0 top-0 z-[3]">
              <div
                className="flex items-center justify-end px-20 py-2 space-x-0.5 rounded-tl-lg rounded-tr-lg bg-background border-b">
                <ToolbarItemNavigator />
                <span>
                  <Separator orientation="vertical" className="h-4 mx-2"/>
                </span>
                <ReadingOptions/>
              </div>
              <span className="absolute right-2 top-[50%] mt-[-16px]">
                <Icon onClick={ () => handleDialogChange(false) }>
                  <X size={ 16 }/>
                </Icon>
              </span>
            </div>
            <div className="relative px-20 py-10">
              { article ? <ArticleDetail article={ article }/> : "" }
            </div>
            {/* </div> */ }
          </>
        </ScrollBox>
      </DialogContent>
    </Dialog>
  );
};
