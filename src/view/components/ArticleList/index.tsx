import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Article } from '../../../infra/types';
import { ArticleReadStatus } from '../../../infra/constants/status';
import { useDataProxy } from '../../hooks/useDataProxy';
import { ArticleItem } from '../ArticleItem';
import { Loading } from '../Loading';
import styles from './articlelist.css';
import { ListFilter } from '../GlobalToolbar';

type ArticleListProps = {
  channelId: string | null;
  onArticleSelect: (article: Article) => void;
  listFilter: ListFilter;
};

export const ArticleList = (props: ArticleListProps): JSX.Element => {
  const dataProxy = useDataProxy();
  const { channelId, listFilter } = props;
  const [loading, setLoading] = useState(true);
  const [articleList, setArticleList] = useState<Article[]>([]);
  const articleListRef = useRef<HTMLDivElement>(null);

  const resetScrollTop = () => {
    if (articleListRef.current !== null) {
      articleListRef.current.scroll(0, 0);
    }
  };

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

  const initial = useCallback(() => {
    if (!channelId) {
      return;
    }

    setLoading(true);

    let promise = Promise.resolve();
    const params: { readStatus?: ArticleReadStatus; channelId?: string } = {};

    if (listFilter.unread) {
      params.readStatus = ArticleReadStatus.unRead;
    }

    if (listFilter.read) {
      params.readStatus = ArticleReadStatus.isRead;
    }

    if (channelId === 'inbox') {
      promise = dataProxy.getArticleList(params);
    } else {
      promise = dataProxy.syncArticlesInCurrentChannel({
        channelId,
        ...params,
      });
    }
    promise
      .then((result: any) => {
        setArticleList(result);
        setLoading(false);
        return result;
      })
      .catch((err) => {
        setLoading(false);
      });
  }, [channelId, listFilter]);

  useEffect(() => {
    resetScrollTop();
    initial();
  }, [channelId, listFilter]);

  return (
    <div className={styles.container} ref={articleListRef}>
      {loading ? <Loading /> : <ul className={styles.list}>{renderList()}</ul>}
    </div>
  );
};
