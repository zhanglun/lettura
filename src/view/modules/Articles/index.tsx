import React from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { ArticleList } from '../../components/ArticleList';
import { GlobalToolbar } from '../../components/GlobalToolbar';
import styles from './index.module.css';

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

  return (
    <div className={styles.article}>
      <GlobalToolbar
        title={title || params.name}
        id={query.get('channelId') as string}
      />
      <ArticleList channelId={query.get('channelId')} />
    </div>
  );
};
