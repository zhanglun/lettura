import React, { useState, useEffect } from 'react';
import styles from './articleitem.module.css';

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

export const ArticleItem = React.memo((props: any) => {
  const { article, onSelect } = props;
  const [readStatus, setReadStatus] = useState(false);
  const [bannerImage, setBannerImage] = useState('');
  const [check, setCheck] = useState(false);

  const handleClick = (e: any) => {
    if(onSelect) {
      onSelect(article);
    }
    setCheck(true)
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
    setBannerImage(parseBannerImage(article.content));
    setReadStatus(article.unread === 0);
  }, [article]);

  return (
    <li
      className={`${styles.item} ${readStatus && styles.read} ${check && styles.current}`}
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
      </div>
    </li>
  );
});
