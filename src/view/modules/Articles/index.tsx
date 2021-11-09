import React, { useCallback, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ArticleList, ListFilter } from '../../components/ArticleList';
import { ArticleView } from '../../components/ArticleView';
import styles from './index.module.css';
import { Article } from '../../../infra/types';

type ArticleModuleProps = {
  title: string;
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const ArticleModule = (props: ArticleModuleProps): JSX.Element => {
  const { title } = props;
  const params: { name: string } = useParams();
  const query = useQuery();
  const [current, setCurrent] = useState<Article | null>(null);

  const handleArticleSelect = useCallback((article: Article) => {
    setCurrent(article);
  }, []);

  return (
    <div className={styles.article}>
      {/* <GlobalToolbar /> */}
      <div className={styles.mainView}>
        <ArticleList
          title={title || params.name}
          channelId={query.get('channelId')}
          onArticleSelect={handleArticleSelect}
        />
        <ArticleView article={current} />
      </div>
    </div>
  );
};
