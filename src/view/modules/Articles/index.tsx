import React, { useCallback, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ArticleList } from '../../components/ArticleList';
import { ArticleView } from '../../components/ArticleView';
import { GlobalToolbar } from '../../components/GlobalToolbar';
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
      <GlobalToolbar
        title={title || params.name}
        id={query.get('channelId') as string}
      />
      <div className={styles.mainView}>
        <ArticleList
          channelId={query.get('channelId')}
          onArticleSelect={handleArticleSelect}
        />
        <ArticleView article={current} />
      </div>
    </div>
  );
};
