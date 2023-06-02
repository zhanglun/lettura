import React, { ForwardedRef, useEffect, useState } from "react";
import classnames from "classnames";
import Dayjs from "dayjs";
import { useBearStore } from "@/hooks/useBearStore";
import { getChannelFavicon } from "@/helpers/parseXML";
import * as dataAgent from "@/helpers/dataAgent";

export const ArticleCardItem = (props: any) => {
  const { article } = props;
  const store = useBearStore((state) => ({
    updateArticleAndIdx: state.updateArticleAndIdx,
    article: state.article,
    setArticleDialogViewStatus: state.setArticleDialogViewStatus,
    channel: state.channel,
  }));
  const [highlight, setHighlight] = useState<boolean>();
  const [readStatus, setReadStatus] = useState(article.read_status);
  const [banner, setBanner] = useState("");

  const updateCurrentArticle = (article: any) => {
    if (article.read_status === 1) {
      setReadStatus(2);
    }

    store.updateArticleAndIdx(article);
  };

  const handleClick = async (e: React.MouseEvent) => {
    store.setArticleDialogViewStatus(true);

    updateCurrentArticle(article);
  };

  const ico = getChannelFavicon(article.channel_link);

  useEffect(() => {
    setReadStatus(article.read_status);
  }, [article.read_status]);

  useEffect(() => {
    setHighlight(store.article?.id === article.id);

    if (article) {
      console.log("%c Line:45 🍷 (article.content || article.description)", "color:#ed9ec7", (article.content || article.description));

      let match_img = (article.content || article.description).match(
        /<img.*?src="(.*?)"/
      );

      console.log("%c Line:45 🍔 match_img", "color:#93c0a4", match_img);

      if (match_img && match_img[1]) {
        setBanner(match_img[1]);
      } else {
        dataAgent.getBestImage(article.link).then((res) => {
          setBanner(res);
        });
      }
    }
  }, [article]);

  return (
    <li
      className={classnames(
        "list-none rounded-md border border-border overflow-hidden hover:cursor-pointer",
        {
          "text-[hsl(var(--foreground)_/_80%)]": readStatus === 2,
          "bg-article-active-bg": highlight,
        }
      )}
      onClick={handleClick}
      aria-current="page"
      id={article.uuid}
      tabIndex={1}
    >
      {/*{ readStatus === 1 && (*/}
      {/*  <div className="absolute left-2 top-50% mt-[-1] w-2 h-2 rounded-full bg-primary"/>*/}
      {/*) }*/}
      <div className="relative h-0 before:content-[''] before:inline-block pt-[60%] overflow-hidden bg-muted">
        <img src={banner} alt="..." className="absolute" />
      </div>
      <div className="p-4 space-y-2">
        <div
          className={classnames(
            `${
              highlight
                ? "text-article-active-headline"
                : "text-article-headline"
            }`,
            "font-bold text-sm group-hover:text-article-active-headline"
          )}
        >
          {article.title}
        </div>
        <div className="flex items-center space-x-1">
          <img
            src={store.channel?.logo || ico}
            alt=""
            className="rounded w-4 mr-1"
          />
          <span className="text-xs">
            {article.author || article.channel_title}
          </span>
        </div>
        <div className="line-clamp-3">
          <p
            className={classnames(
              "text-xs text-article-paragraph group-hover:text-article-active-paragraph",
              {
                "text-article-active-paragraph": highlight,
              }
            )}
          >
            {(article.description || "").replace(/<[^<>]+>/g, "")}
          </p>
        </div>
        <div
          className={classnames(
            "flex justify-between items-center text-xs text-article-paragraph group-hover:text-article-active-paragraph",
            {
              "text-article-active-paragraph": highlight,
            }
          )}
        >
          <div>
            {Dayjs(article.pub_date || article.create_date).format(
              "YYYY-MM-DD HH:mm"
            )}
          </div>
        </div>
      </div>
    </li>
  );
};
