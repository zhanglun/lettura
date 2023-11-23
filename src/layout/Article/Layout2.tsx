import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { ArticleLineList } from "@/components/ArticleList/LineList";
import { useQuery } from "@/helpers/parseXML";
import { ScrollBoxRefObject } from "@/components/ArticleView/ScrollBox";
import { useBearStore } from "@/stores";

export const Layout2 = (): JSX.Element => {
  // @ts-ignore
  const params: { name: string } = useParams();
  const store = useBearStore((state) => ({
    article: state.article,
  }));
  const [feedUrl, type, feedUuid] = useQuery();
  const scrollBoxRef = useRef<ScrollBoxRefObject>(null);

  useEffect(() => {
    scrollBoxRef.current?.scrollToTop();
  }, [store.article]);

  return (
    <ArticleLineList
      feedUuid={feedUuid}
      type={type}
      feedUrl={feedUrl || ""}
      title={params.name}
    />
  );
};
