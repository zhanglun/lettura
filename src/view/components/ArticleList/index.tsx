import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from 'react';
import { Article } from '../../../infra/types';
import { ArticleReadStatus } from '../../../infra/constants/status';
import { useEventPub } from '../../hooks/useEventPub';
import { useDataProxy } from '../../hooks/useDataProxy';
import { ArticleItem } from '../ArticleItem';
import styles from './articlelist.css';

export const ArticleList = (): JSX.Element => {
  const dataProxy = useDataProxy();
  const [articleList, setArticleList] = useState<Article[]>([]);
  const [currentLink, setCurrentLink] = useState<string>('');
  const articleListRef = useRef<HTMLDivElement>(null);

  const viewDetail = useCallback(async (article: Article) => {
    setCurrentLink(article.link);
    article.hasRead = ArticleReadStatus.isRead;
  }, []);

  const resetScrollTop = () => {
    if (articleListRef.current !== null) {
      articleListRef.current.scroll(0, 0);
    }
  };

  const renderList = useCallback((): JSX.Element[] => {
    return articleList.map((article: Article, i: number) => {
      return <ArticleItem article={article} key={article.id} />;
    });
  }, [articleList, currentLink, viewDetail]);

  useEffect(() => {
    dataProxy
      .getArticleList()
      .then((result) => {
        setArticleList(result);
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <div className={styles.container} ref={articleListRef}>
      <ul className={styles.list}>{renderList()}</ul>
    </div>
  );
};
