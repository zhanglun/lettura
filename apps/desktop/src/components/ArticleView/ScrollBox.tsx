import clsx from "clsx";
import React, { useImperativeHandle, useRef } from "react";

export interface ScrollBoxRefObject {
  scrollToTop: () => void;
  /**
   * 键盘滚动（详情内 j/k）：dir 1 向下 / -1 向上，按视口高度步进。
   * 已到对应边缘返回 false（调用方决定是否切换上/下一篇）。
   */
  scrollByViewport: (dir: 1 | -1) => boolean;
}

export interface ScrollBoxProps {
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<any>;
  /** 滚动进度回调（0-100），详情顶栏进度发丝线用 */
  onProgress?: (pct: number) => void;
}

export const ScrollBox = React.forwardRef((props: ScrollBoxProps, ref: any) => {
  const { className, children, onProgress } = props;
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (scrollRef.current !== null) {
      scrollRef.current.scroll(0, 0);
    }
  };

  useImperativeHandle(ref, () => {
    const atBottom = (el: HTMLDivElement) =>
      el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    const atTop = (el: HTMLDivElement) => el.scrollTop <= 4;

    return {
      scrollToTop,
      scrollByViewport: (dir: 1 | -1) => {
        const el = scrollRef.current;
        if (!el) return false;
        if (dir > 0 && atBottom(el)) return false;
        if (dir < 0 && atTop(el)) return false;
        el.scrollBy({ top: dir * el.clientHeight * 0.85, behavior: "smooth" });
        return true;
      },
    };
  });

  const handleScroll = () => {
    if (!(onProgress && scrollRef.current)) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const max = scrollHeight - clientHeight;
    onProgress(max <= 0 ? 0 : Math.min(100, (scrollTop / max) * 100));
  };

  return (
    <div
      className={clsx("min-h-0 overflow-y-auto fusion-inset-tail", className)}
      ref={scrollRef}
      onScroll={handleScroll}
    >
      {children}
    </div>
  );
});
