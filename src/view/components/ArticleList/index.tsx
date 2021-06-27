import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from 'react';
import Dayjs from 'dayjs';
import { Article } from '../../../infra/types';
import { ArticleReadStatus } from '../../../infra/constants/status';
import { Toolbar } from './Toolbar';

import styles from './article.module.css';
import { useEventPub } from '../../hooks/useEventPub';
import { useDataProxy } from '../../hooks/useDataProxy';

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

  const renderList = useCallback((): JSX.Element => {
    return (
      <ul className={styles.list}>
        {articleList.map((article: Article, i: number) => {
          return (
            <li
              // eslint-disable-next-line react/no-array-index-key
              key={article.title + i}
              className={`${styles.item} ${
                article.hasRead === ArticleReadStatus.isRead && styles.read
              } ${article.link === currentLink && styles.current}`}
              onClick={() => viewDetail(article)}
              aria-hidden="true"
            >
              <div className={styles.title}>{article.title}</div>
              <div className={styles.meta}>
                <span className={styles.channel}>{article.channelTitle}</span>
                <span className={styles.pubTime}>
                  {Dayjs(article.pubDate).format('YYYY-MM-DD HH:mm')}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    );
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
      {renderList()}
    </div>
  );
};
