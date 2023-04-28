import React, { ForwardedRef, useEffect, useState } from "react";
import classnames from "classnames";
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
        setReadStatus(2);
      }

      store.updateArticleAndIdx(article);
    };

    const handleClick = async (e: React.MouseEvent) => {
      if (onSelect) {
        onSelect(article);
      }

      updateCurrentArticle(article);
    };

    const ico = getChannelFavicon(article.channel_link);

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
          <div className={`font-bold text-sm ${highlight ? "text-white" : ""}`}>
            {article.title}
          </div>
        </div>
        <div className={classnames(styles.description, { "text-white": highlight })}>
          {(article.description || "").replace(/<[^<>]+>/g, "")}
        </div>
        <div className={classnames(styles.meta, {'text-white': highlight})}>
          <div className={classnames("flex items-center", {'text-white': highlight})}>
            <img src={ico} alt="" className="rounded w-4 mr-1" />
            {article.author || article.channel_title}
          </div>
          <div className={classnames({'text-white': highlight})}>
            {Dayjs(article.pub_date.replace(/-/gi, "/")).format(
              "YYYY-MM-DD HH:mm",
            )}
          </div>
        </div>
      </li>
    );
  },
);
