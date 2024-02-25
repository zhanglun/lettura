import { useState } from "react";

export function useScrollTop(): [number, any]{
  const [scrollTop, setScrollTop] = useState(0);
  console.log("🚀 ~ useScrollTop ~ scrollTop:", scrollTop)

  // @ts-ignore
  const onScroll = (event: React.UIEvent<HTMLDivElement>) => setScrollTop(event.target.scrollTop);

  return [scrollTop, { onScroll }];
}
