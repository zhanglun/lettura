import { useState } from "react";

export function useScrollTop(): [
  number,
  { onScroll: (event: React.UIEvent<HTMLDivElement>) => void },
] {
  const [scrollTop, setScrollTop] = useState(0);
  console.log("🚀 ~ useScrollTop ~ scrollTop:", scrollTop);

  const onScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop((event.target as HTMLDivElement).scrollTop);
  };

  return [scrollTop, { onScroll }];
}
