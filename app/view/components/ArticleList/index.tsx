import React, { useState, useEffect, useContext } from 'react';
import { observer } from 'mobx-react';
import Dayjs from 'dayjs';
import styles from './article.module.css';
import { ArticleEntity } from '../../../entity/article';
import { StoreContext, StoreType } from '../../stores';
import { Article } from '../../../infra/types';

type Props = {
  type: 'all' | 'favorite' | 'channel';
};

export const ArticleList = observer(
  (props: Props): JSX.Element => {
    const { type } = props;
    const [articleList, setArticleList] = useState<Article[]>([]);
    const [currentLink, setCurrentLink] = useState<string>('');

    const { channelStore, articleStore } = useContext(
      StoreContext
    ) as StoreType;
    const { currentChannel } = channelStore;

    function viewDetail(article: ArticleEntity) {
      articleStore.setCurrentView(article);
      setCurrentLink(article.link);
    }

    function renderList(): JSX.Element {
      return (
        <ul className={styles.list}>
          {articleList.map((article: Article, i: number) => {
            return (
              <li
                // eslint-disable-next-line react/no-array-index-key
                key={article.title + i}
                className={`${styles.item} ${
                  article.link === currentLink && styles.read
                }`}
                onClick={() => viewDetail(article)}
                aria-hidden="true"
              >
                <div className={styles.title}>{article.title}</div>
                <div className={styles.meta}>
                  <span className={styles.channel}>{article.channelTitle}</span>
                  <span className={styles.pubTime}>
                    {Dayjs(article.pubDate).format('YYYY-MM-DD HH:mm')}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      );
    }

    const getArticleList = async () => {
      console.log('currentType', type);

      if (type === 'all') {
        const list = await articleStore.getAllList();
        return setArticleList(list);
      }

      const list = await articleStore.getListWithChannelId(currentChannel.id);

      console.log(list);

      return setArticleList(list);
    };

    useEffect(() => {
      getArticleList();
    }, [type, currentChannel]);

    return <div className={styles.container}>{renderList()}</div>;
  }
);
