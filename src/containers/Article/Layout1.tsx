import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleList } from "@/components/ArticleList";
import { ArticleView } from "@/components/ArticleView";
import { useBearStore } from "@/hooks/useBearStore";
import { useQuery } from "@/helpers/parseXML";
import styles from "./index.module.scss";

export const Layout1 = (): JSX.Element => {
  // @ts-ignore
  const params: { name: string } = useParams();
  const store = useBearStore((state) => ({
    article: state.article,
    articleList: state.articleList,
    setArticle: state.setArticle,
    updateArticleAndIdx: state.updateArticleAndIdx,
    channel: state.channel,

    filterList: state.filterList,
    currentFilter: state.currentFilter,
    setFilter: state.setFilter,

    currentIdx: state.currentIdx,
    setCurrentIdx: state.setCurrentIdx,
    userConfig: state.userConfig,
  }));

  const [ feedUrl, type, channelUuid ] = useQuery();
  const [syncing, setSyncing] = useState(false);
  const viewRef = useRef<HTMLDivElement>(null);
  const { currentIdx, setCurrentIdx } = store;

  console.warn("layout1 render");

  const resetScrollTop = () => {
    if (viewRef.current !== null) {
      viewRef.current.scroll(0, 0);
    }
  };

  useEffect(() => {
    resetScrollTop();
  }, [store.article]);

  return (
    <div className="grid grid-cols-[var(--app-article-width)_1fr]">
      <div className="relative h-full border-r border-stone-100">
        {syncing && <div className={styles.syncingBar}>同步中</div>}
        <ArticleList
          title={params.name}
          type={type}
          feedUuid={channelUuid}
          feedUrl={feedUrl || ""}
        />
      </div>
      <div className={styles.scrollView} ref={viewRef}>
        <ArticleView article={store.article} userConfig={store.userConfig} />
      </div>
    </div>
  );
};
