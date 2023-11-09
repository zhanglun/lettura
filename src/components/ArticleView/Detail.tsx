import React, { useEffect, useRef, useState } from "react";
import classnames from "classnames";
import styles from "@/components/ArticleView/view.module.scss";
import Dayjs from "dayjs";
import { getChannelFavicon } from "@/helpers/parseXML";
import { useBearStore } from "@/stores";
import * as dataAgent from "@/helpers/dataAgent";
import { motion, AnimatePresence } from "framer-motion";
import { fetch } from "@tauri-apps/api/http";
import { open } from "@tauri-apps/api/shell";
import xss from "xss";
import linkifyStr from "linkify-string";

function createMarkup(html: string) {
  return { __html: html };
}

export interface ArticleDetailProps {
  article: any;
}

export const ArticleDetail = (props: ArticleDetailProps) => {
  const { article } = props;
  const store = useBearStore((state) => ({
    feed: state.feed,
  }));
  const { pub_date, channel_link } = article;
  const ico = getChannelFavicon(channel_link);
  const [pageContent, setPageContent] = useState("");
  const [banner, setBanner] = useState("");
  const [showBanner, setShowBanner] = useState(false);
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

      if (
        href &&
        (href.indexOf("http://") >= 0 ||
          href.indexOf("https://") >= 0 ||
          href.indexOf("www.") >= 0)
      ) {
        open(href);
      } else if (href.indexOf("#") === 0) {
        open(`${article.link}${href}`);
      }
    }
  }

  function renderMediaBox(media: any) {
    const { description, content, thumbnails } = media;

    function renderContent() {
      return content.map((c: any) => {
        if (/youtube.com\/v/.test(c.url)) {
          const videoId = c.url.split("/").pop();
          return (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              width="640"
              height="360"
            />
          );
        }
      });
    }

    console.log(
      "%c Line:92 🥐 linkifyStr(description.content)",
      "color:#b03734",
      linkifyStr(description.content)
    );

    return (
      <div className="reading-content">
        <div className="pb-6">{renderContent()}</div>
        <div style={{whiteSpace: "pre-line"}}
          dangerouslySetInnerHTML={createMarkup(
            linkifyStr(description.content)
          )}
        />
      </div>
    );
  }

  useEffect(() => {
    setBanner("");
    setPageContent("");

    // dataAgent.getBestImage(article.link).then(({ data }) => {
    //   console.log("%c Line:39 🥖 data", "color:#fca650", data);
    //   data && setBanner(data);
    // });

    article &&
      dataAgent
        .getArticleDetail(article.uuid, {
          signal: controller.signal,
        })
        .then((res) => {
          console.log("%c Line:102 🥓 res", "color:#33a5ff", res);
          const { data } = res;
          const content = (data.content || data.description || "").replace(
            /<a[^>]+>/gi,
            (a: string) => {
              if (!/\starget\s*=/gi.test(a)) {
                return a.replace(/^<a\s/, '<a target="_blank"');
              }

              return a;
            }
          );

          // try to get the best banner if there is no image in article content
          // it will make render slower
          setShowBanner(content.search(/<img[^>]+>/gi) === -1);
          setPageContent(xss(content));

          try {
            setMedias(JSON.parse(data.media_object));
          } catch (e) {
            setMedias([]);
          }
        });

    return () => {
      controller.abort();
    };
  }, [article]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
      // key={article.uuid}
      // initial={{ y: 10, opacity: 0 }}
      // animate={{ y: 0, opacity: 1 }}
      // exit={{ y: -10, opacity: 0 }}
      // transition={{ duration: 0.2 }}
      >
        <div className="m-auto">
          <div className="pb-4 border-b border-border">
            <div className="mt-6 mb-5 text-4xl font-bold text-detail-headline">
              {article.title}
            </div>
            <div className={classnames(styles.meta)}>
              <span className={styles.channelInfo}>
                <img src={store.feed?.logo || ico} alt="" className="rounded" />
                {article.channel_title}
              </span>
              {article.author && (
                <span
                  className={classnames(styles.author, "text-detail-paragraph")}
                >
                  {article.author}
                </span>
              )}
              <span
                className={classnames(styles.time, "text-detail-paragraph")}
              >
                {Dayjs(new Date(pub_date || new Date())).format(
                  "YYYY-MM-DD HH:mm"
                )}
              </span>
            </div>
          </div>
          <div className="m-auto pt-1 mt-6">
            {article.image && (
              <div className="w-full my-4  text-center">
                <img src={article.image} alt="" className="bg-accent" />
              </div>
            )}
            <div
              key={article.uuid}
              onClick={delegateContentClick}
              className={classnames("reading-content", "text-detail-paragraph")}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={createMarkup(pageContent)}
            />
            {medias.length > 0 && <div>{medias.map(renderMediaBox)}</div>}
            {/* <div
              className={classnames("reading-content", "text-detail-paragraph")}>
                <iframe src={article.link} className="w-full" allowFullScreen></iframe>
              </div> */}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
