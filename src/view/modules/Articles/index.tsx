import React from 'react';
import { ArticleList } from '../../components/ArticleList';
import { GlobalToolbar } from '../../components/GlobalToolbar';
import styles from './index.module.css';

type ArticleModuleProps = {
  title: string;
};

export const ArticleModule = (props: ArticleModuleProps): JSX.Element => {
  const { title } = props;

  return (
    <div className={styles.article}>
      <GlobalToolbar title={title} id="123" />
      <ArticleList />
    </div>
  );
};
