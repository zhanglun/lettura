import classNames from "classnames";
import { useHotkeys } from "react-hotkeys-hook";
import React, { useImperativeHandle, useRef } from "react";

export interface ScrollBoxRefObject {
  scrollToTop: () => void;
}

export interface ScrollBoxProps {
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<any>;
}

export const ScrollBox = React.forwardRef((props: ScrollBoxProps, ref: any) => {
  const { className, children } = props;
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop += 100;
    }
  };

  const scrollUp = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop -= 100;
    }
  };

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

  useHotkeys("j", scrollDown);
  useHotkeys("k", scrollUp);

  return (
    <div className={classNames("overflow-y-auto", className)} ref={scrollRef}>
      {children}
    </div>
  );
});
