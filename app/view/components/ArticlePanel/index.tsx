import React from 'react';
import styles from './articlepanel.module.css';
import { ArticleList } from '../ArticleList';
import { ArticleView } from '../ArticleView';

export const ArticlePanel = (): JSX.Element => {
  return (
    <React.Fragment key="article">
      <div className={styles.articleList}>
        <ArticleList />
      </div>
      <div className={styles.reader}>
        <ArticleView />
      </div>
    </React.Fragment>
  );
};
