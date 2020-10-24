import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import styles from './article.module.css';
import { Article } from '../../../infra/types';
import { channelStore } from '../../stores';

export interface Props {
  articleList: Article[];
}

function viewDetail(article: Article) {
  channelStore.setCurrentView(article);
}

function renderList(props: Props): JSX.Element {
  const { articleList } = props;

  return (
    <ul className={styles.list}>
      {articleList.map((article: Article, i: number) => {
        return (
          <li
            // eslint-disable-next-line react/no-array-index-key
            key={article.title + i}
            className={styles.item}
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

export const ArticleList = observer(
  (): JSX.Element => {
    const [articleList, setArticleList] = useState<Article[]>([]);
    const { feedUrl } = channelStore.currentChannel;

    const getArticleList = async () => {
      const list = await channelStore.getArticleList(feedUrl);
      return setArticleList(list);
    };
    useEffect(() => {
      getArticleList();
    }, [feedUrl]);

    return (
      <div className={styles.container}>{renderList({ articleList })}</div>
    );
  }
);
