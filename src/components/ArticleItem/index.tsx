import React, { useState, useEffect } from "react";
import Dayjs from 'dayjs';
import styles from "./articleitem.module.scss";

export const ArticleItem = React.memo((props: any) => {
  const { article, onSelect } = props;

  console.log(article);

  const [readStatus, setReadStatus] = useState(false);
  const [check, setCheck] = useState(false);

  const handleClick = (e: any) => {
    if (onSelect) {
      onSelect(article);
    }
    setCheck(true);
  };

  useEffect(() => {
    setReadStatus(article.unread === 0);
  }, [article]);

  return (
    <li
      className={`${styles.item} ${readStatus && styles.read} ${check && styles.current}`}
      onClick={handleClick}
      aria-hidden="true"
    >
      <div className={styles.title}>
        <div className={styles.titleText}>{article.title}</div>
      </div>
      <div className={styles.description}>{(article.description || '').replace(/<[^<>]+>/g, '')}</div>
      <div className={styles.meta}>
        <div>{article.author}</div>
        <div className={styles.date}>{Dayjs(article.pubDate).format('YYYY-MM-DD hh:mm')}</div>
      </div>
    </li>
  );
});
