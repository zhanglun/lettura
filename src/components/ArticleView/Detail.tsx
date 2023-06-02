import React, { useEffect, useRef, useState } from 'react';
import classnames from "classnames";
import styles from "@/components/ArticleView/view.module.scss";
import Dayjs from "dayjs";
import { getChannelFavicon } from "@/helpers/parseXML";
import { useBearStore } from "@/hooks/useBearStore";
import * as dataAgent from "@/helpers/dataAgent";
import { fetch } from "@tauri-apps/api/http";

function createMarkup(html: string) {
  return { __html: html };
}

export interface ArticleDetailProps {
  article: any,
}

export const ArticleDetail = (props: ArticleDetailProps) => {
  const { article } = props;
  const store = useBearStore((state) => ({
    channel: state.channel,
  }))
  const { pub_date, channel_link } = article;
  const ico = getChannelFavicon(channel_link);

  const containerRef = useRef<HTMLDivElement>(null);
  const [ pageContent, setPageContent ] = useState("");
  const [ banner, setBanner ] = useState("");

  const parseImages = (content: string) => {
    const dom = new DOMParser().parseFromString(content, "text/html");
    const images = dom.querySelectorAll("img");

    images.forEach((img) => {
      fetch(img.src, {
        method: "GET",
        responseType: 3,
      }).then((res: any) => {
        const data = new Uint8Array(res.data as number[]);
        const blobUrl = URL.createObjectURL(
          new Blob([ data.buffer ], { type: "image/png" })
        );
        (
          document.querySelector(`img[src="${ img.src }"]`) as HTMLImageElement
        ).src = blobUrl;
      });
    });
  };

  useEffect(() => {
    setBanner("");
    setPageContent("");

    article && Promise.all([
      dataAgent.getArticleDetail(article.uuid),
      // dataAgent.getBestImage(article.link),
      Promise.resolve("")
    ]).then(([ res, image ]) => {
      console.log("%c Line:137 🌶 image", "color:#42b983", image);
      console.log("%c Line:102 🥓 res", "color:#33a5ff", res);
      const content = (res.content || res.description || "").replace(
        /<a[^>]+>/gi,
        (a: string) => {
          if (!/\starget\s*=/gi.test(a)) {
            return a.replace(/^<a\s/, '<a target="_blank"');
          }

          return a;
        }
      );

      if (image && content.search(/<img[^>]+>/ig) === -1) {
        setBanner(image);
      }

      setPageContent(content);
      // parseImages(content);
    });
  }, [ article ]);

  return (
    <div ref={ containerRef }>
      <div className="m-auto">
        <div className="pb-4 border-b border-slate-100">
          <div className="mt-6 mb-5 text-4xl font-bold text-detail-headline">
            { article.title }
          </div>
          <div className={ classnames(styles.meta) }>
              <span
                className={ classnames(styles.time, "text-detail-paragraph") }
              >
                { Dayjs(new Date(pub_date || new Date())).format("YYYY-MM-DD HH:mm") }
              </span>
            <span className={ styles.channelInfo }>
                <img src={ store.channel?.logo || ico } alt="" className="rounded"/>
              { article.channel_title }
              </span>
            { article.author && (
              <span
                className={ classnames(styles.author, "text-detail-paragraph") }
              >
                  { article.author }
                </span>
            ) }
          </div>
        </div>
        <div className="m-auto pt-1 mt-6">
          { banner && article.image && (
            <div className={ styles.banner }>
              <img src={ article.image } alt=""/>
            </div>
          ) }
          <div
            className={ classnames('reading-content', "text-detail-paragraph") }
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={ createMarkup(pageContent) }
          />
        </div>
      </div>
    </div>);
}
