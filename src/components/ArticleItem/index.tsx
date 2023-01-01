import React, { ForwardedRef, useEffect, useState } from "react";
import Dayjs from "dayjs";
import { useStore } from "../../hooks/useStore";
import styles from "./articleitem.module.scss";
import { getChannelFavicon } from "../../helpers/parseXML";

export const ArticleItem = React.forwardRef((props: any, ref: ForwardedRef<HTMLLIElement>) => {
  const { article, onSelect, highlight } = props;
  const [readStatus, setReadStatus] = useState(article.read_status);
  const store = useStore();

  const updateCurrentArticle = (article: any) => {
    if (article.read_status === 1) {
      setReadStatus(1);
    }

    store.updateArticleAndIdx(article);
  }

  const handleClick = async (e: any) => {
    if (onSelect) {
      onSelect(article);
    }

    updateCurrentArticle(article)
  };

  const ico = getChannelFavicon(article.feed_url);

  useEffect(() => {
    setReadStatus(article.read_status)
  }, [article.read_status])

  return (
    <li
      className={`${styles.item} ${readStatus === 2 ? styles.read : ""} ${
        highlight ? styles.current : ""
      }`}
      onClick={handleClick}
      aria-current="page"
      ref={ref}
      tabIndex={1}
    >
      {(readStatus === 1) && <div className={styles.dot} />}
      <div className={styles.title}>
        <div className={styles.titleText}>
          {highlight} {article.title}
        </div>
      </div>
      <div className={styles.description}>
        {(article.description || "").replace(/<[^<>]+>/g, "")}
      </div>
      <div className={styles.meta}>
        <div className={styles.author}><img src={ico} alt="" />{article.author}</div>
        <div className={styles.date}>
          {Dayjs(article.pub_date.replace(/-/ig, '/')).format("YYYY-MM-DD HH:mm")}
        </div>
      </div>
    </li>
  );
});
