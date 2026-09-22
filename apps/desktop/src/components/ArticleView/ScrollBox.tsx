import clsx from "clsx";
import React, { useImperativeHandle, useRef } from "react";

export interface ScrollBoxRefObject {
  scrollToTop: () => void;
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
    return {
      scrollToTop,
    };
  });

  const handleScroll = () => {
    if (!onProgress || !scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const max = scrollHeight - clientHeight;
    onProgress(max > 0 ? Math.min(100, (scrollTop / max) * 100) : 0);
  };

  return (
    <div
      className={clsx("min-h-0 overflow-y-auto", className)}
      ref={scrollRef}
      onScroll={handleScroll}
    >
      {children}
    </div>
  );
});
