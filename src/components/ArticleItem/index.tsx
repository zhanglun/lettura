import React, { ForwardedRef, useEffect, useState } from "react";
import Dayjs from "dayjs";
import { useBearStore } from "../../hooks/useBearStore";
import styles from "./articleitem.module.scss";
import { getChannelFavicon } from "../../helpers/parseXML";

export const ArticleItem = React.forwardRef(
  (props: any, ref: ForwardedRef<HTMLLIElement>) => {
    const store = useBearStore(state => ({
      updateArticleAndIdx: state.updateArticleAndIdx,
      article: state.article,
    }));
    const { article, onSelect } = props;
    const [highlight, setHighlight] = useState<boolean>();
    const [readStatus, setReadStatus] = useState(article.read_status);

    const updateCurrentArticle = (article: any) => {
      if (article.read_status === 1) {
        setReadStatus(1);
      }

      store.updateArticleAndIdx(article);
    };

    const handleClick = async (e: React.MouseEvent) => {
      if (onSelect) {
        onSelect(article);
      }

      updateCurrentArticle(article);
    };

    const ico = getChannelFavicon(article.feed_url);

    useEffect(() => {
      setReadStatus(article.read_status);
    }, [article.read_status]);

    useEffect(() => {
      setHighlight(store.article?.id === article.id)
    }, [store.article, article])

    return (
      <li
        className={`${styles.item} ${readStatus === 2 ? styles.read : ""} ${
          highlight ? styles.current : ""
        }`}
        onClick={handleClick}
        aria-current="page"
        ref={ref}
        id={article.uuid}
        tabIndex={1}
      >
        {readStatus === 1 && <div className={styles.dot} />}
        <div className={styles.title}>
          <div className={styles.titleText}>
            {highlight} {article.title}
          </div>
        </div>
        <div className={styles.description}>
          {(article.description || "").replace(/<[^<>]+>/g, "")}
        </div>
        <div className={styles.meta}>
          <div className={styles.author}>
            <img src={ico} alt="" />
            {article.author}
          </div>
          <div className={styles.date}>
            {Dayjs(article.pub_date.replace(/-/gi, "/")).format(
              "YYYY-MM-DD HH:mm",
            )}
          </div>
        </div>
      </li>
    );
  },
);
