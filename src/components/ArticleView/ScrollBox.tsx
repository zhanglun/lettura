import { useShortcut } from "@/hooks/useShortcut";
import classNames from "classnames";
import React, { useEffect, useImperativeHandle, useRef } from "react";

export interface ScrollBoxRefObject {
  scrollToTop: () => void,
}

export interface ScrollBoxProps {
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<any>;
}

export const ScrollBox = React.forwardRef((props: ScrollBoxProps, ref: any) => {
  const { className, children } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const { registerShortcut, unregisterShortcut } = useShortcut();

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
  }

  useImperativeHandle(ref, () => {
    return {
      scrollToTop,
    }
  });

  useEffect(() => {
    registerShortcut("j", scrollDown);
    registerShortcut("k", scrollUp);

    return () => {
      unregisterShortcut("j");
      unregisterShortcut("k");
    }
  }, []);

  return (
    <div className={classNames("overflow-y-auto", className)} ref={scrollRef}>
      {children}
    </div>
  );
});
