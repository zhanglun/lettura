import React, { useEffect, useRef } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleCardList } from "@/components/ArticleList/CardList";
import { useQuery } from "@/helpers/parseXML";
import { ScrollBoxRefObject } from "@/components/ArticleView/ScrollBox";
import { useBearStore } from "@/hooks/useBearStore";

export const Layout3 = (): JSX.Element => {
  // @ts-ignore
  const params: { name: string } = useParams();
  const store = useBearStore((state) => ({
    article: state.article,
  }));
  const [feedUrl, type, channelUuid] = useQuery();
  const scrollBoxRef = useRef<ScrollBoxRefObject>(null);

  useEffect(() => {
    scrollBoxRef.current?.scrollToTop();
  }, [store.article]);

  return (
    <ArticleCardList
      feedUuid={channelUuid}
      type={type}
      feedUrl={feedUrl || ""}
      title={params.name}
    />
  );
};
