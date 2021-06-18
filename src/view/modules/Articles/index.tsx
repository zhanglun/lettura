import React from 'react';
import styles from './index.module.css';
import { ArticleList } from '../../components/ArticleList';

export const ArticleModule = (): JSX.Element => {
  return (
    <div className={styles.articleList}>
      <ArticleList />
    </div>
  );
};
