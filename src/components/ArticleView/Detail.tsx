import React, { useEffect, useMemo, useState } from "react";
import { getFeedLogo } from "@/helpers/parseXML";
import * as dataAgent from "@/helpers/dataAgent";
import { open } from "@tauri-apps/api/shell";
import DOMPurify from "dompurify";
import { ArticleResItem } from "@/db";
import { YoutubeAdapter } from "./adapter/Youtube";
import { PodcastAdapter } from "./adapter/Podcast";
import { CommonAdapter } from "./adapter/Common";

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
  const logo = useMemo(() => {
    return article.feed_logo || getFeedLogo(article.feed_url);
  }, [article]);
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
    console.log("🚀 ~ file: Detail.tsx:75 ~ renderMain ~ isPodcast:", isPodcast);

    if (isYoutube) {
      return <YoutubeAdapter article={article} content={pageContent} medias={medias} />;
    } else if (isPodcast) {
      return <PodcastAdapter article={article} content={pageContent} medias={medias} />;
    } else {
      return (
        <CommonAdapter
          article={article}
          content={pageContent}
          feedLogo={logo}
          delegateContentClick={delegateContentClick}
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

          content = content.replace(/<img\s+(?:[^>]*?\s+)?src="([^"]*)"[^>]*>/g, (match, src) => {
            const absoluteUrl = new URL(src, article.link).href;
            return `<img src="${absoluteUrl}" />`;
          });

          console.log("%c Line:131 🍭 content", "color:#4fff4B", content);

          setPageContent(
            DOMPurify.sanitize(content)
            // xss(content, {
            //   whiteList: {
            //     ...getDefaultWhiteList(),
            //     iframe: [],
            //     button: [],
            //   },
            //   css: false,
            // })
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

  return renderMain();
};
