import React, { useState, useEffect } from "react";
import styles from "./articleitem.module.scss";

export const ArticleItem = React.memo((props: any) => {
  const { article, onSelect } = props;
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
    </li>
  );
});
