import React, { useCallback, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleList } from "../../components/ArticleList";
import { ArticleView } from "../../components/ArticleView";
import { MainHeader } from "../../components/MainHeader";
import styles from "./index.module.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const ArticleContainer = (): JSX.Element => {
  // @ts-ignore
  const params: { name: string } = useParams();
  const query = useQuery();
  const [current, setCurrent] = useState<any>(null);

  const handleArticleSelect = useCallback((article: any) => {
    setCurrent(article);
  }, []);

  return (
    <div className={styles.article}>
      <MainHeader
        title={params.name}
        channelId={query.get("channelId")}
        feedUrl={query.get("feedUrl")}
      />
      <div className={styles.mainView}>
        <ArticleList
          title={params.name}
          channelId={query.get("channelId")}
          feedUrl={query.get("feedUrl")}
          onArticleSelect={handleArticleSelect}
        />
        <ArticleView article={current} />
      </div>
    </div>
  );
};
