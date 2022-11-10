import React, { useEffect, useState } from "react";
import Dayjs from "dayjs";
import { useStore } from "../../hooks/useStore";
import styles from "./articleitem.module.scss";
import { busChannel } from "../../helpers/busChannel";
import * as dataAgent from "../../helpers/dataAgent";

export const ArticleItem = React.memo((props: any) => {
  const { article, onSelect, highlight } = props;
  const [readStatus, setReadStatus] = useState(article.read_status);
  const store = useStore();

  const updateCurrentArticle = (article: any) => {
    if (article.read_status === 1) {
      dataAgent.updateArticleReadStatus(article.uuid, 2).then((res) => {
        if (res) {
          busChannel.emit("updateChannelUnreadCount", {
            uuid: article.channel_uuid,
            action: "decrease",
            count: 1,
          });

          setReadStatus(true);
        }
      });
    }

    store.setArticle(article);
  }

  const handleClick = async (e: any) => {
    if (onSelect) {
      onSelect(article);
    }

    updateCurrentArticle(article)
  };

  useEffect(() => {
    setReadStatus(article.read_status)
    console.log("%c Line:37 🍞 article.read_status", "color:#fca650", article.read_status);
  }, [article.read_status])

  return (
    <li
      className={`${styles.item} ${readStatus === 2 ? styles.read : ""} ${
        highlight ? styles.current : ""
      }`}
      onClick={handleClick}
      aria-hidden="true"
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
        <div>{article.author}</div>
        <div className={styles.date}>
          {Dayjs(article.pub_date).format("YYYY-MM-DD HH:mm")}
        </div>
      </div>
    </li>
  );
});
