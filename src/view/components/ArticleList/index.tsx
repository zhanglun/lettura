import React, {
  useState,
  useEffect,
  useMemo,
  useContext,
  useRef,
  useCallback,
} from 'react';
import { Article } from '../../../infra/types';
import { ArticleReadStatus } from '../../../infra/constants/status';
import { useDataProxy } from '../../hooks/useDataProxy';
import { ArticleItem } from '../ArticleItem';
// import { Loading } from '../Loading';
import styles from './articlelist.css';
import { useEventPub } from '../../hooks/useEventPub';

type ArticleListProps = {
  channelId: string | null;
};

export const ArticleList = (props: ArticleListProps): JSX.Element => {
  const dataProxy = useDataProxy();
  const { eventPubEmit } = useEventPub();
  // const [loading, setLoading] = useState(true);
  const [articleList, setArticleList] = useState<Article[]>([]);
  const [currentLink, setCurrentLink] = useState<string>('');
  const articleListRef = useRef<HTMLDivElement>(null);

  const viewDetail = async (article: Article) => {
    setCurrentLink(article.link);
    article.hasRead = ArticleReadStatus.isRead;
  };

  const resetScrollTop = () => {
    if (articleListRef.current !== null) {
      articleListRef.current.scroll(0, 0);
    }
  };

  const renderList = useCallback((): JSX.Element[] => {
    return articleList.map((article: Article) => {
      return <ArticleItem article={article} key={article.id} />;
    });
  }, [articleList]);

  useEffect(() => {
    resetScrollTop();

    if (props.channelId) {
      let promise = Promise.resolve();

      if (props.channelId === 'inbox') {
        promise = dataProxy.getArticleList({
          readStatus: ArticleReadStatus.unRead,
        });
      } else {
        promise = dataProxy.syncArticlesInCurrentChannel({
          channelId: props.channelId,
          readStatus: ArticleReadStatus.unRead,
        });
      }
      promise
        .then((result: any) => {
          setArticleList(result);
          return result;
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [props]);

  return (
    <div className={styles.container} ref={articleListRef}>
      <ul className={styles.list}>{renderList()}</ul>
    </div>
  );
};
