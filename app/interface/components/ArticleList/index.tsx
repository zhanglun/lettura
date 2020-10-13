import React from 'react';
import styles from './article.module.css';
import { Article } from '../../../infra/types';

export interface Props {
  articleList: Article[];
}

function renderList(props: Props): JSX.Element {
  const { articleList } = props;

  return (
    <ul className={styles.list}>
      {articleList.map((article: Article, i: number) => {
        return (
          // eslint-disable-next-line react/no-array-index-key
          <li className={styles.item} key={article.title + i}>
            <div className={styles.title}>{article.title}</div>
            <div className={styles.meta}>
              <span className={styles.channel}>订阅频道</span>
              <span className={styles.pubTime}>{article.pubTime}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ArticleList(props: Props): JSX.Element {
  return <div className={styles.container}>{renderList(props)}</div>;
}

export { ArticleList };
