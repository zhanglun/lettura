import React, { useState, useEffect } from "react";
import Dayjs from "dayjs";
import styles from "./articleitem.module.scss";

export const ArticleItem = React.memo((props: any) => {
  const { article, onSelect, highlight } = props;
  const [readStatus, setReadStatus] = useState(false);

  const handleClick = (e: any) => {
    if (onSelect) {
      onSelect(article);
    }
  };

  useEffect(() => {
    setReadStatus(article.unread === 0);
  }, [article]);

  return (
    <li
      className={`${styles.item} ${readStatus ? styles.read : ''} ${highlight ? styles.current : ''}`}
      onClick={handleClick}
      aria-hidden="true"
    >
      {!readStatus && <div className={styles.dot} />}
      <div className={styles.title}>
        <div className={styles.titleText}>{highlight} {article.title}</div>
      </div>
      <div className={styles.description}>{(article.description || "").replace(/<[^<>]+>/g, "")}</div>
      <div className={styles.meta}>
        <div>{article.author}</div>
        <div className={styles.date}>{Dayjs(article.pubDate).format("YYYY-MM-DD hh:mm")}</div>
      </div>
    </li>
  );
});
