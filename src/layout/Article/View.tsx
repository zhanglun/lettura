import { ArticleView } from "@/components/ArticleView";
import {
  ScrollBox,
  ScrollBoxRefObject,
} from "@/components/ArticleView/ScrollBox";
import { useBearStore } from "@/stores";
import { useRef } from "react";
import { ReadingOptions } from "./ReadingOptions";
import { Separator } from "@/components/ui/separator";
import { ToolbarItemNavigator } from "./ToolBar";

export function View() {
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
  }));
  const scrollBoxRef = useRef<ScrollBoxRefObject>(null);

  return (
    <div>
      <div
        className={
          "h-[var(--app-toolbar-height)] flex items-center justify-end px-2 space-x-0.5 border-b"
        }
      >
        <ToolbarItemNavigator />
        <span>
          <Separator orientation="vertical" className="h-4 mx-2" />
        </span>
        <ReadingOptions />
      </div>
      <ScrollBox
        className="h-[calc(100vh_-_var(--app-toolbar-height))]"
        ref={scrollBoxRef}
      >
        <ArticleView userConfig={store.userConfig} />
      </ScrollBox>
    </div>
  );
}
