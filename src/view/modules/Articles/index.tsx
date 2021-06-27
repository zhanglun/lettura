import React from 'react';
import { ArticleList } from '../../components/ArticleList';
import styles from './index.module.css';

export const ArticleModule = (): JSX.Element => {
  return (
    <div className={styles.article}>
      <ArticleList />
    </div>
  );
};
