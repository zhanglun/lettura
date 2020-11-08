import React, { useState, useEffect, useContext } from 'react';
import { observer } from 'mobx-react';
import styles from './article.module.css';
import { Article } from '../../../infra/types';
import { ArticleEntity } from '../../../entity/article';
import { StoreContext, StoreType } from '../../stores';

export interface Props {
  articleList: Article[];
}
export const ArticleList = observer(
  (): JSX.Element => {
    const [articleList, setArticleList] = useState<ArticleEntity[]>([]);
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
          {articleList.map((article: ArticleEntity, i: number) => {
            return (
              <li
                // eslint-disable-next-line react/no-array-index-key
                key={article.title + i}
                className={`${styles.item} ${
                  article.link === currentLink && styles.itemReaded
                }`}
                onClick={() => viewDetail(article)}
                aria-hidden="true"
              >
                <div className={styles.title}>{article.title}</div>
                <div className={styles.meta}>
                  {/* <span className={styles.channel}>{article.channelTitle}</span> */}
                  <span className={styles.pubTime}>{article.pubDate}</span>
                </div>
              </li>
            );
          })}
        </ul>
      );
    }

    const getArticleList = async () => {
      const list = await articleStore.getAllList();
      return setArticleList(list);
    };
    useEffect(() => {
      getArticleList();
    }, [currentChannel]);

    return <div className={styles.container}>{renderList()}</div>;
  }
);
