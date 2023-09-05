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

  const ico = getChannelFavicon(article.channel_link);

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
        // dataAgent.getBestImage(article.link).then((res) => {
        //   setBanner(res);
        // });
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
      {/*{ readStatus === 1 && (*/ }
      {/*  <div className="absolute left-2 top-50% mt-[-1] w-2 h-2 rounded-full bg-primary"/>*/ }
      {/*) }*/ }
      {/*<div className="relative h-[140px] overflow-hidden bg-muted bg-cover bg-center">*/}
      {/*  <div className="w-full h-full transition-all group-hover:scale-[1.5]" style={ { backgroundImage: `url(${ banner })` } }>*/}
      {/*  </div>*/}
      {/*</div>*/}
      <div className="relative overflow-hidden w-full h-[140px] aspect-[1.57] group">
          <div className="w-full h-full transition-all bg-center bg-cover group-hover:scale-[1.5]" style={ { backgroundImage: `url(${ banner })` } }>
          </div>
        <div className="
            absolute left-0 right-0 bottom-0 top-0 transition-all
            p-2 bg-gradient-to-r from-black/50 to-black/0 group-hover:from-white/0 group-hover:to-white/0
          ">
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
            src={ store.channel?.logo || ico }
            alt=""
            className="rounded w-4 mr-1"
          />
          <span className="text-xs">
            { article.author || article.channel_title }
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
