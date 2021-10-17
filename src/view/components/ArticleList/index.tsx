import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Article } from '../../../infra/types';
import { ArticleReadStatus } from '../../../infra/constants/status';
import { useDataProxy } from '../../hooks/useDataProxy';
import { ArticleItem } from '../ArticleItem';
import styles from './articlelist.css';

type ArticleListProps = {
  channelId: string | null;
  onArticleSelect: (article: Article) => void;
};

export const ArticleList = (props: ArticleListProps): JSX.Element => {
  const dataProxy = useDataProxy();
  const [articleList, setArticleList] = useState<Article[]>([]);
  const articleListRef = useRef<HTMLDivElement>(null);

  const resetScrollTop = () => {
    if (articleListRef.current !== null) {
      articleListRef.current.scroll(0, 0);
    }
  };

  console.log('redenr--->');

  const handleArticleSelect = (article: Article) => {
    if (props.onArticleSelect) {
      props.onArticleSelect(article);
    }
  };

  const renderList = useCallback((): JSX.Element[] => {
    return articleList.map((article: Article) => {
      return (
        <ArticleItem
          article={article}
          key={article.id}
          onSelect={handleArticleSelect}
        />
      );
    });
  }, [articleList]);

  useEffect(() => {
    resetScrollTop();

    if (props.channelId) {
      let promise = Promise.resolve();

      if (props.channelId === 'inbox') {
        promise = dataProxy.getArticleList({
          readStatus: ArticleReadStatus.unRead,
        });
      } else {
        promise = dataProxy.syncArticlesInCurrentChannel({
          channelId: props.channelId,
          readStatus: ArticleReadStatus.unRead,
        });
      }
      promise
        .then((result: any) => {
          setArticleList(result);
          return result;
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [props]);

  return (
    <div className={styles.container} ref={articleListRef}>
      <ul className={styles.list}>{renderList()}</ul>
    </div>
  );
};
