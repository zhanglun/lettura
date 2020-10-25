import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import styles from './article.module.css';
import { Article } from '../../../infra/types';
import { channelStore } from '../../stores';

export interface Props {
  articleList: Article[];
}
export const ArticleList = observer(
  (): JSX.Element => {
    const [articleList, setArticleList] = useState<Article[]>([]);
    const [currentLink, setCurrentLink] = useState<string>('');
    const { feedUrl } = channelStore.currentChannel;

    function viewDetail(article: Article) {
      channelStore.setCurrentView(article);
      setCurrentLink(article.link);
    }

    function renderList(): JSX.Element {
      return (
        <ul className={styles.list}>
          {articleList.map((article: Article, i: number) => {
            return (
              <li
                // eslint-disable-next-line react/no-array-index-key
                key={article.title + i}
                className={`${styles.item} ${
                  article.link === currentLink && styles.itemHighlight
                }`}
                onClick={() => viewDetail(article)}
                aria-hidden="true"
              >
                <div className={styles.title}>{article.title}</div>
                <div className={styles.meta}>
                  <span className={styles.channel}>{article.channelTitle}</span>
                  <span className={styles.pubTime}>{article.pubDate}</span>
                </div>
              </li>
            );
          })}
        </ul>
      );
    }

    const getArticleList = async () => {
      const list = await channelStore.getArticleList(feedUrl);
      return setArticleList(list);
    };
    useEffect(() => {
      getArticleList();
    }, [feedUrl]);

    return <div className={styles.container}>{renderList()}</div>;
  }
);
