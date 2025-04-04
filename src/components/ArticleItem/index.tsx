import React, { ForwardedRef, useEffect, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useBearStore } from "@/stores";
import { getFeedLogo } from "@/helpers/parseXML";
import { ArticleResItem } from "@/db";
import { ArticleReadStatus } from "@/typing";
import clsx from "clsx";
import { Avatar } from "@radix-ui/themes";
import { useShallow } from "zustand/react/shallow";

export const ArticleItem = React.forwardRef((props: { article: ArticleResItem }, ref: ForwardedRef<HTMLLIElement>) => {
  const store = useBearStore(
    useShallow((state) => ({
      updateArticleStatus: state.updateArticleStatus,
      article: state.article,
      setArticle: state.setArticle,
      feed: state.feed,
    }))
  );
  const { article } = props;
  const [highlight, setHighlight] = useState<boolean>();
  const [readStatus, setReadStatus] = useState(article.read_status);

  const updateCurrentArticle = (article: any) => {
    if (article.read_status === ArticleReadStatus.UNREAD) {
      setReadStatus(ArticleReadStatus.READ);
    }

    store.updateArticleStatus({ ...article }, ArticleReadStatus.READ);
    store.setArticle(article);
  };

  const handleClick = async (e: React.MouseEvent) => {
    updateCurrentArticle(article);
  };

  const ico = getFeedLogo(article.feed_url);

  useEffect(() => {
    setReadStatus(article.read_status);
  }, [article.read_status]);

  useEffect(() => {
    setHighlight(store.article?.id === article.id);
  }, [store.article, article]);

  return (
    <li
      className={clsx(
        "list-none rounded-md p-2 py-2 pl-5 flex flex-col gap-1 relative select-none",
        "group hover:bg-[var(--accent-a3)] hover:cursor-pointer",
        {
          "text-[var(--gray-10)]": readStatus === ArticleReadStatus.READ,
          "bg-[var(--accent-4)] text-[var(--accent-11)] hover:bg-[var(--accent-4)]": highlight,
        }
      )}
      onClick={handleClick}
      ref={ref}
      id={article.uuid}
    >
      {readStatus === ArticleReadStatus.UNREAD && (
        <div className="absolute left-2 top-[16px] w-2 h-2 rounded-full bg-[var(--accent-9)]" />
      )}
      <div className="font-semibold text-sm break-all">{article.title}</div>
      <div className="text-xs line-clamp-2 break-all">{(article.description || "").replace(/<[^<>]+>/g, "")}</div>
      <div className="flex justify-between items-center text-xs mt-2">
        <div className="flex-1 overflow-hidden flex items-center gap-1.5">
          <Avatar
            size="1"
            src={store.feed?.logo || getFeedLogo(article.feed_url)}
            fallback={article.feed_title?.slice(0, 1) || "L"}
            alt={article.feed_title}
            className="rounded w-4 h-4"
          />
          <div className="overflow-hidden text-ellipsis mr-1 whitespace-nowrap">
            {article.author || article.feed_title}
          </div>
        </div>
        <div className="whitespace-nowrap flex-[0_0_auto] overflow-hidden">
          {formatDistanceToNow(new Date(article.pub_date || article.create_date), {
            includeSeconds: true,
            addSuffix: true,
          })}
        </div>
      </div>
    </li>
  );
});
