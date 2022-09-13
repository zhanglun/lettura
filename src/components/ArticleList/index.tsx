/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArticleItem } from "../ArticleItem";
import { Loading } from "../Loading";
import { Article, db } from "../../db";

import styles from "./articlelist.module.css";
import { useStore } from "../../hooks/useStore";

type ListFilter = {
  all?: boolean;
  unread?: boolean;
  read?: boolean;
};

type ArticleListProps = {
  channelId: string | null;
  feedUrl: string | null;
  title: string | null;
  onArticleSelect: (article: any) => void;
};

export const ArticleList = (props: ArticleListProps): JSX.Element => {
  const { channelId, feedUrl } = props;
  const store = useStore();
  const [highlightItem, setHighlightItem] = useState<Article>();
  const articleList =
    (useLiveQuery(
      () =>
        db.articles
          .where("feedUrl")
          .equalsIgnoreCase(feedUrl as string)
          // .and((a) => a.unread === 1)
          .reverse()
          .sortBy("id"),
      [feedUrl]
    ) || []).filter((c) => {
      if (store.currentFilter.id === "1") {
        return true;
      }

      if (store.currentFilter.id === "2") {
        return c.unread === 1;
      }

      if (store.currentFilter.id === "3") {
        return c.unread === 0;
      }
    });

  const [loading, setLoading] = useState(false);
  const articleListRef = useRef<HTMLDivElement>(null);
  const [syncing, setSyncing] = useState(false);

  const resetScrollTop = () => {
    if (articleListRef.current !== null) {
      articleListRef.current.scroll(0, 0);
    }
  };

  const handleArticleSelect = (article: any) => {
    db.articles.update(article.id, {
      unread: 0
    });

    if (props.onArticleSelect) {
      props.onArticleSelect(article);
      console.log(article)
      setHighlightItem(article);
    }
  };

  useEffect(() => {
  });

  const renderList = (): JSX.Element[] => {
    return articleList.map((article: any, idx: number) => {
      return (
        <ArticleItem
          article={article}
          highlight={true}
          key={article.id}
          onSelect={handleArticleSelect}
        />
      );
    });
  };

  /**
   * 判断是否需要同步
   * @param channel 频道信息
   */
  const checkSyncStatus = (channel: any | null) => {
  };

  const showAll = () => {
  };

  const showUnread = () => {
  };

  const showRead = () => {
  };

  const markAllRead = () => {
  };

  useEffect(() => {
    resetScrollTop();
  }, []);

  useEffect(() => {
    resetScrollTop();
  }, [channelId]);

  return (
    <div className={styles.container}>
      <div className={styles.inner} ref={articleListRef}>
        {syncing && <div className={styles.syncingBar}>同步中</div>}
        {loading ? (
          <Loading />
        ) : (
          <ul className={styles.list}>{renderList()}</ul>
        )}
      </div>
    </div>
  );
};
