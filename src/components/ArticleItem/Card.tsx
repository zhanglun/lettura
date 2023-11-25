import React, { ForwardedRef, useEffect, useState } from "react";
import classnames from "classnames";
import Dayjs from "dayjs";
import { useBearStore } from "@/stores";
import {getBestImages, getChannelFavicon} from "@/helpers/parseXML";
import * as dataAgent from "@/helpers/dataAgent";

export const ArticleCardItem = (props: any) => {
  const { article } = props;
  const store = useBearStore((state) => ({
    updateArticleAndIdx: state.updateArticleAndIdx,
    article: state.article,
    setArticleDialogViewStatus: state.setArticleDialogViewStatus,
    feed: state.feed,
  }));
  const [ highlight, setHighlight ] = useState<boolean>();
  const [ readStatus, setReadStatus ] = useState(article.read_status);
  const [ banner, setBanner ] = useState("");

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

  const ico = getChannelFavicon(article.feed_url);

  useEffect(() => {
    setReadStatus(article.read_status);
  }, [ article.read_status ]);

  useEffect(() => {
    setHighlight(store.article?.id === article.id);

    if (article) {
      let match_img = (article.description || article.description).match(
        /<img.*?src="(.*?)"/,
      );

      console.log("%c Line:45 🍔 match_img", "color:#93c0a4", match_img);

      if (match_img?.[1]) {
        setBanner(match_img[1]);
      } else {
        getBestImages([article]).then((res) => {
          setBanner(res[0].image);
        });
      }
    }
  }, [ article ]);

  return (
    <li
      className={ classnames(
        "list-none rounded-md border border-border overflow-hidden hover:cursor-pointer group",
        {
          "text-[hsl(var(--foreground)_/_80%)]": readStatus === 2,
          "bg-article-active-bg": highlight,
        },
      ) }
      onClick={ handleClick }
      id={ article.uuid }
    >
      <div className="relative h-[140px] overflow-hidden bg-muted">
        <div className="w-full h-full bg-cover bg-center transition-all group-hover:scale-[1.5]" style={ { backgroundImage: `url(${ banner })` } }>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div
          className={ classnames(
            `${
              highlight
                ? "text-article-active-headline"
                : "text-article-headline"
            }`,
            "font-bold text-sm group-hover:text-article-active-headline line-clamp-2",
          ) }
        >
          { article.title }
        </div>
        <div className="flex items-center space-x-1">
          <img
            src={ store.feed?.logo || ico }
            alt=""
            className="rounded w-4 mr-1"
          />
          <span className="text-xs">
            { article.author || article.feed_title }
          </span>
        </div>
        <div className="line-clamp-3">
          <p
            className={ classnames(
              "text-xs text-article-paragraph group-hover:text-article-active-paragraph",
              {
                "text-article-active-paragraph": highlight,
              },
            ) }
          >
            { (article.description || "").replace(/<[^<>]+>/g, "") }
          </p>
        </div>
        <div
          className={ classnames(
            "flex justify-between items-center text-xs text-article-paragraph group-hover:text-article-active-paragraph",
            {
              "text-article-active-paragraph": highlight,
            },
          ) }
        >
          <div>
            { Dayjs(article.pub_date || article.create_date).format(
              "YYYY-MM-DD HH:mm",
            ) }
          </div>
        </div>
      </div>
    </li>
  );
};
