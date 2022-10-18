/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useEffect, useState, forwardRef, useRef, useImperativeHandle, ForwardedRef } from "react";
import { ArticleItem } from "../ArticleItem";
import { Loading } from "../Loading";
import { Article, db } from "../../db";
import * as dataAgent from "../../helpers/dataAgent";

import styles from "./articlelist.module.css";
import { useStore } from "../../hooks/useStore";
import { invoke } from "@tauri-apps/api";

export type ArticleListProps = {
  channelId: string | null;
  feedUrl: string | null;
  title: string | null;
};

export interface ArticleListRefType {
  getList: () => void
}

export const ArticleList = forwardRef((props: ArticleListProps, ref: ForwardedRef<ArticleListRefType>): JSX.Element => {
  const { channelId, feedUrl = "" } = props;
  const store = useStore();
  const [highlightItem, setHighlightItem] = useState<Article>();
  const [articleList, setArticleList] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const articleListRef = useRef<HTMLDivElement>(null);

  const resetScrollTop = () => {
    if (articleListRef.current !== null) {
      articleListRef.current.scroll(0, 0);
    }
  };

  const handleArticleSelect = (article: any) => {
    db.articles.update(article.id, {
      unread: 0
    });

    setHighlightItem(article);
  };

  useImperativeHandle(ref, () => {
    return {
      getList() {
        getList(feedUrl || '')
      }
    }
  })

  const getList = (feedUrl: string) => {
    const filter: {unread?: 1 | 0 } = { }

    if (store.currentFilter.id === "2") {
      filter.unread = 1;
    }

    if (store.currentFilter.id === "3") {
      filter.unread = 0;
    }

    console.time('111111')

    dataAgent.getAllArticleListByChannel(feedUrl || "", filter || null).then((res) => {
      setArticleList(res);
      console.timeEnd('111111')
    });
  }

  useEffect(() => {
    getList(feedUrl || '')
  }, [feedUrl, store.currentFilter]);

  const renderList = (): JSX.Element[] => {
    return articleList.map((article: any, idx: number) => {
      return (
        <ArticleItem
          article={article}
          highlight={highlightItem?.id === article.id}
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
  }, [channelId, articleList]);

  return (
    <div className={styles.container}>
      <div className={styles.inner} ref={articleListRef}>
        {loading ? (
          <Loading/>
        ) : (
          <ul className={styles.list}>{renderList()}</ul>
        )}
      </div>
    </div>
  );
});
