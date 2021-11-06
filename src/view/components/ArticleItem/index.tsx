import React, { useState, useCallback, useEffect } from 'react';
import Dayjs from 'dayjs';
import { ArticleReadStatus } from '../../../infra/constants/status';
import { Article } from '../../../infra/types';
import styles from './articleitem.css';
import { useDataProxy } from '../../hooks/useDataProxy';

type ArticleItemProps = {
  article: Article;
  onSelect: (article: Article) => any;
};

export const ArticleItem = (props: ArticleItemProps) => {
  const dataProxy = useDataProxy();
  const { article, onSelect } = props;
  const [readStatus, setReadStatus] = useState(false);
  const [bannerImage, setBannerImage] = useState('');

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

  const handleClick = (e: any) => {
    markAsRead(e);

    if (onSelect) {
      onSelect(article);
    }
  };

  const parseBannerImage = (content: string): string => {
    const banner =
      'https://img.iplaysoft.com/wp-content/uploads/2021/p/coloros12-wallpapers/coloros12.jpg';

    if (!content) {
      return banner;
    }

    const matchs = content.match(/<img[^>]+src="(\S*)"/);

    return (matchs && matchs[1]) || banner;
  };

  useEffect(() => {
    setReadStatus(article.hasRead === ArticleReadStatus.isRead);
    setBannerImage(parseBannerImage(article.content));
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
          style={{ backgroundImage: `url("${bannerImage}")` }}
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
          {Dayjs(article.pubDate).format('YYYY-MM-DD HH:mm')}
        </div>
      </div>
    </li>
  );
};
