import { useShortcut } from '@/hooks/useShortcut';
import classNames from 'classnames';
import React, { useEffect, useRef } from 'react';

export interface ScrollBoxProps {
  children: React.ReactNode,
  className?: string,
  ref?: React.Ref<any>,
}

export const ScrollBox = (props: ScrollBoxProps) => {
  const { className, children } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const { registerShortcut, unregisterShortcut } = useShortcut();

  const scrollDown = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop += 100;
    }
  }

  const scrollUp = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop -= 100;
    }
  }

  useEffect(() => {
    registerShortcut("j", scrollDown);
    registerShortcut("k", scrollUp);
  }, []);

  return (
    <div className={classNames("overflow-y-auto", className)} ref={scrollRef}>
      {children}
    </div>
  )
}
