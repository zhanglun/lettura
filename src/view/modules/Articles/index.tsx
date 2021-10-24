import React, { useCallback, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ArticleList } from '../../components/ArticleList';
import { ArticleView } from '../../components/ArticleView';
import { GlobalToolbar, ListFilter } from '../../components/GlobalToolbar';
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
  const [listFilter, setListFilter] = useState<ListFilter>({
    unread: true,
  });

  const handleArticleSelect = useCallback((article: Article) => {
    setCurrent(article);
  }, []);

  const handleFilterList = useCallback((filter: ListFilter) => {
    setListFilter(filter);
  }, []);

  return (
    <div className={styles.article}>
      <GlobalToolbar
        title={title || params.name}
        id={query.get('channelId') as string}
        onFilterList={handleFilterList}
      />
      <div className={styles.mainView}>
        <ArticleList
          channelId={query.get('channelId')}
          onArticleSelect={handleArticleSelect}
          listFilter={listFilter}
        />
        <ArticleView article={current} />
      </div>
    </div>
  );
};
