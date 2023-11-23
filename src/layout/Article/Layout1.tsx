import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleList } from "@/components/ArticleList";
import { ArticleView } from "@/components/ArticleView";
import { useBearStore } from "@/stores";
import { useQuery } from "@/helpers/parseXML";
import styles from "./index.module.scss";
import {
  ScrollBox,
  ScrollBoxRefObject,
} from "@/components/ArticleView/ScrollBox";

export const Layout1 = (): JSX.Element => {
  // @ts-ignore
  const params: { name: string } = useParams();
  const store = useBearStore((state) => ({
    article: state.article,
    articleList: state.articleList,
    setArticle: state.setArticle,
    updateArticleAndIdx: state.updateArticleAndIdx,
    feed: state.feed,

    filterList: state.filterList,
    currentFilter: state.currentFilter,
    setFilter: state.setFilter,

    currentIdx: state.currentIdx,
    setCurrentIdx: state.setCurrentIdx,
    userConfig: state.userConfig,
  }));

  const [feedUrl, type, feedUuid] = useQuery();
  const [syncing, setSyncing] = useState(false);
  const scrollBoxRef = useRef<ScrollBoxRefObject>(null);

  useEffect(() => {
    scrollBoxRef.current?.scrollToTop();
  }, [store.article]);

  return (
    <div className="grid grid-cols-[var(--app-article-width)_1fr]">
      <div className="relative h-full border-r">
        {syncing && <div className={styles.syncingBar}>同步中</div>}
        <ArticleList
          title={params.name}
          type={type}
          feedUuid={feedUuid}
          feedUrl={feedUrl || ""}
        />
      </div>
      <ScrollBox
        className="h-[calc(100vh_-_var(--app-toolbar-height))]"
        ref={scrollBoxRef}
      >
        <ArticleView userConfig={store.userConfig} />
      </ScrollBox>
    </div>
  );
};
