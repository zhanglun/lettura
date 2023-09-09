import React, { ForwardedRef, useEffect, useState } from "react";
import classnames from "classnames";
import Dayjs from "dayjs";
import { useBearStore } from "@/stores";
import { getChannelFavicon } from "@/helpers/parseXML";

export const ArticleItem = React.forwardRef(
  (props: any, ref: ForwardedRef<HTMLLIElement>) => {
    const store = useBearStore((state) => ({
      updateArticleAndIdx: state.updateArticleAndIdx,
      article: state.article,
      feed: state.feed,
    }));
    const { article } = props;
    const [highlight, setHighlight] = useState<boolean>();
    const [readStatus, setReadStatus] = useState(article.read_status);

    const updateCurrentArticle = (article: any) => {
      if (article.read_status === 1) {
        setReadStatus(2);
      }

      store.updateArticleAndIdx(article);
    };

    const handleClick = async (e: React.MouseEvent) => {
      console.log("%c Line:32 🍡 article", "color:#ffdd4d", article);

      updateCurrentArticle(article);
    };

    const ico = getChannelFavicon(article.channel_link);

    useEffect(() => {
      setReadStatus(article.read_status);
    }, [article.read_status]);

    useEffect(() => {
      setHighlight(store.article?.id === article.id);
    }, [store.article, article]);

    return (
      <li
        className={classnames(
          "list-none rounded-sm p-3 pl-6 grid gap-1 relative select-none",
          "group hover:bg-article-active-bg hover:cursor-pointer",
          {
            "text-[hsl(var(--foreground)_/_80%)]": readStatus === 2,
            "bg-article-active-bg": highlight,
          },
        )}
        onClick={handleClick}
        ref={ref}
        id={article.uuid}
      >
        {readStatus === 1 && (
          <div className="absolute left-2 top-4 w-2 h-2 rounded-full bg-primary" />
        )}
        <div
          className={classnames(
            `${
              highlight
                ? "text-article-active-headline"
                : "text-article-headline"
            }`,
            "font-bold text-sm group-hover:text-article-active-headline",
          )}
        >
          {article.title}
        </div>
        <div
          className={classnames(
            "text-xs line-clamp-2",
            "text-article-paragraph group-hover:text-article-active-paragraph",
            {
              "text-article-active-paragraph": highlight,
            },
          )}
        >
          {(article.description || "").replace(/<[^<>]+>/g, "")}
        </div>
        <div
          className={classnames(
            "flex justify-between items-center text-xs text-article-paragraph group-hover:text-article-active-paragraph",
            {
              "text-article-active-paragraph": highlight,
            },
          )}
        >
          <div className={classnames("flex items-center")}>
            <img
              src={store.feed?.logo || ico}
              alt=""
              className="rounded w-4 mr-1"
            />
            {article.author || article.channel_title}
          </div>
          <div>
            {Dayjs(new Date(article.pub_date || article.create_date)).format(
              "YYYY-MM-DD HH:mm",
            )}
          </div>
        </div>
      </li>
    );
  },
);
