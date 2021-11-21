import React, { useState, useCallback, useEffect } from 'react';
import Dayjs from 'dayjs';
import { ArticleReadStatus } from '../../../infra/constants/status';
import { Article } from '../../../infra/types';
import styles from './articleitem.css';
import { useDataProxy } from '../../hooks/useDataProxy';

import bannerImage1 from './images/pattern-1.png';
import bannerImage2 from './images/pattern-2.png';
import bannerImage3 from './images/pattern-3.png';
import bannerImage4 from './images/pattern-4.png';
import bannerImage5 from './images/pattern-5.png';

const bannerImageList = [
  bannerImage1,
  bannerImage2,
  bannerImage3,
  bannerImage4,
  bannerImage5,
];

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
        .MARK_ARTICLE_READ(article)
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
    const banner = bannerImageList[Math.ceil(Math.random() * 4)];

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
