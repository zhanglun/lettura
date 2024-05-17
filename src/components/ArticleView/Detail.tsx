import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import styles from "@/components/ArticleView/view.module.scss";
import Dayjs from "dayjs";
import { getChannelFavicon } from "@/helpers/parseXML";
import { useBearStore } from "@/stores";
import * as dataAgent from "@/helpers/dataAgent";
import { open } from "@tauri-apps/api/shell";
import xss, { getDefaultWhiteList } from "xss";
import linkifyStr from "linkify-string";
import { ArticleResItem } from "@/db";
import { YoutubeAdapter } from "./adpater/Youtube";
import { PodcastAdapter } from "./adpater/Podcast";
import { Avatar, Heading, Separator } from "@radix-ui/themes";

function createMarkup(html: string) {
  return { __html: html };
}

function validateFeed(article: ArticleResItem, medias: any) {
  const { feed_url } = article;

  let isCommon = true;
  let isYoutube = false;
  let isPodcast = false;

  if (/youtube.com\/feeds\/videos.xml/.test(feed_url)) {
    isYoutube = true;
    isCommon = false;
  } else if (medias?.length > 0) {
    isPodcast = true;
    isCommon = false;
  }

  return {
    isCommon,
    isYoutube,
    isPodcast,
  };
}

export interface ArticleDetailProps {
  article: any;
}

export const ArticleDetail = (props: ArticleDetailProps) => {
  const { article } = props;
  const store = useBearStore((state) => ({
    feed: state.feed,
  }));
  const { pub_date, feed_url } = article;
  const ico = getChannelFavicon(feed_url);
  const [pageContent, setPageContent] = useState("");
  const [medias, setMedias] = useState([]);
  const controller = new AbortController();

  function delegateContentClick(e: React.MouseEvent<HTMLElement>) {
    let elem = null;
    const i = e.nativeEvent.composedPath();

    for (let a = 0; a <= i.length - 1; a++) {
      const s = i[a] as HTMLElement;

      if ("A" === s.tagName) {
        elem = s;
        break;
      }
    }

    if (elem && elem.getAttribute("href")) {
      e.preventDefault();
      e.stopPropagation();

      const href = elem.getAttribute("href") || "";

      if (href && (href.indexOf("http://") >= 0 || href.indexOf("https://") >= 0 || href.indexOf("www.") >= 0)) {
        open(href);
      } else if (href.indexOf("#") === 0) {
        open(`${article.link}${href}`);
      }
    }
  }

  function renderMain() {
    const { isCommon, isYoutube, isPodcast } = validateFeed(article, medias || []);

    if (isYoutube) {
      return <YoutubeAdapter article={article} content={pageContent} medias={medias} />;
    } else if (isPodcast) {
      return <PodcastAdapter article={article} content={pageContent} medias={medias} />;
    } else {
      return (
        <div
          key={article.uuid}
          className={clsx("reading-content")}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={createMarkup(pageContent)}
        />
      );
    }
  }

  useEffect(() => {
    setPageContent("");

    article &&
      dataAgent
        .getArticleDetail(article.uuid, {
          signal: controller.signal,
        })
        .then((res) => {
          console.log("%c Line:102 🥓 res", "color:#33a5ff", res);
          const { data } = res;
          let content;

          if (data.content && data.description) {
            content = data.content.length > data.description.length ? data.content : data.description;
          } else {
            content = data.description || data.content || "";
          }

          content = content.replace(/<a[^>]+>/gi, (a: string) => {
            if (!/\starget\s*=/gi.test(a)) {
              return a.replace(/^<a\s/, '<a target="_blank"');
            }

            return a;
          });

          setPageContent(
            xss(content, {
              whiteList: {
                ...getDefaultWhiteList(),
                iframe: [],
                button: [],
              },
            })
          );

          try {
            setMedias(JSON.parse(data.media_object));
            console.log("%c Line:147 🌽 JSON.parse(data.media_object)", "color:#42b983", JSON.parse(data.media_object));
          } catch (e) {
            setMedias([]);
          }
        });

    return () => {
      controller.abort();
    };
  }, [article]);

  return (
    <div className="m-auto pt-1 pb-10 px-4 max-w-[calc(var(--reading-editable-line-width)_*_1px)]">
      <div className="pb-4">
        <Heading className="mt-6 mb-5" size="8">
          {article.title}
        </Heading>
        <div className="flex items-center gap-2 text-sm sm:flex-wrap">
          <div className="flex items-center gap-2 rounded-full bg-[var(--gray-4)] pr-3">
            <Avatar
              radius="full"
              className="w-8 h-8"
              src={store.feed?.logo || ico}
              fallback={article.feed_title.slice(0, 1)}
            ></Avatar>
            <span className="text-[var(--gray-11)]">{article.feed_title}</span>
          </div>
          <span>{Dayjs(new Date(pub_date || new Date())).format("YYYY-MM-DD HH:mm")}</span>
          {article.author && <span className={clsx(styles.author)}>· {article.author}</span>}
        </div>
      </div>
      <Separator size="4"/>
      <div className="m-auto pt-1 mt-6" onClick={delegateContentClick}>
        {article.image && (
          <div className="w-full my-4  text-center">
            <img src={article.image} alt="" className="bg-accent" />
          </div>
        )}
        {renderMain()}
      </div>
    </div>
  );
};
