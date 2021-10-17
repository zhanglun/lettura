import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Dayjs from 'dayjs';
import { Icon } from '../Icon';
import { ArticleReadStatus } from '../../../infra/constants/status';
import { Article } from '../../../infra/types';
import { openBrowser } from '../../../infra/utils';
import styles from './articleitem.css';
import { useDataProxy } from '../../hooks/useDataProxy';

type ArticleItemProps = {
  article: Article;
};

function createMarkup(html: string) {
  return { __html: html };
}

export const ArticleItem = (props: ArticleItemProps) => {
  const dataProxy = useDataProxy();
  const { article } = props;
  const [readStatus, setReadStatus] = useState(false);

  const markAsRead = useCallback(
    (e) => {
      e.stopPropagation();
      dataProxy
        .markAsRead(article)
        .then((result: boolean) => {
          setReadStatus(result);
          return result;
        })
        .catch((err) => {
          console.log(err);
        });
    },
    [dataProxy, article]
  );

  const handleClick = useCallback((e) => {
    markAsRead(e);
  }, []);

  const openWebPage = useCallback(
    (e) => {
      openBrowser(article.link);
      e.stopPropagation();
    },
    [article]
  );

  useEffect(() => {
    setReadStatus(article.hasRead === ArticleReadStatus.isRead);
  }, [article]);

  return (
    <li
      className={`${styles.item} ${readStatus && styles.read}`}
      onClick={handleClick}
      aria-hidden="true"
    >
      <div className={styles.header}>
        <div
          className={styles.image}
          style={{
            backgroundImage:
              'url("https://img.iplaysoft.com/wp-content/uploads/2021/p/coloros12-wallpapers/coloros12.jpg")',
          }}
        />
        <div className={styles.title}>
          <div className={styles.titleText}>{article.title}</div>
        </div>
        {/* <div className={styles.actions}> */}
        {/*  <Icon customClass={styles.icon} name="bookmark_add" /> */}
        {/*  <Icon customClass={styles.icon} name="favorite_border" /> */}
        {/*  <Icon customClass={styles.icon} name="done" onClick={markAsRead} /> */}
        {/*  <Icon customClass={styles.icon} name="launch" onClick={openWebPage} /> */}
        {/* </div> */}
        <div className={styles.date}>
          {Dayjs(article.pubDate).format('MM/DD HH:mm')}
        </div>
      </div>
    </li>
  );
};
