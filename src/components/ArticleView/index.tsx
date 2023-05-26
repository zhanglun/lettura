import React, { useEffect, useRef, useState } from "react";
import Dayjs from "dayjs";
import classnames from "classnames";
import styles from "./view.module.scss";
import { getChannelFavicon } from "../../helpers/parseXML";
import * as dataAgent from "../../helpers/dataAgent";

type ArticleViewProps = {
  article: any | null;
  userConfig: UserConfig;
};

function createMarkup(html: string) {
  return { __html: html };
}

export const ArticleView = (props: ArticleViewProps): JSX.Element => {
  const { article, userConfig } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const helpBarRef = useRef<HTMLDivElement>(null);
  const [ pageContent, setPageContent ] = useState("");
  const [ showBanner, setShowBanner ] = useState(false);

  const renderPlaceholder = () => {
    return "Please Select Some read";
  };

  const renderDetail = () => {
    if (!article) {
      return null;
    }

    const { pub_date, channel_link } = article;
    const ico = getChannelFavicon(channel_link);

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
                { Dayjs(pub_date.replace(/-/gi, "/")).format("YYYY-MM-DD HH:mm") }
              </span>
              <span className={ styles.channelInfo }>
                <img src={ ico } alt="" className="rounded"/>
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
            { showBanner && article.image && (
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
      </div>
    );
  };

  const parseImages = (content: string) => {
    const dom = new DOMParser().parseFromString(content, "text/html");
    const images = dom.querySelectorAll("img");

    images.forEach((img) => {
      fetch(img.src, {
        method: "GET",
        // responseType: 3,
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
    if (article) {
      dataAgent.getArticleDetail(article.uuid).then((res) => {
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

        if (
          res.image &&
          content.includes(res.image.split("/").slice(-1)[0])
        ) {
          setShowBanner(false);
        } else {
          setShowBanner(true);
        }

        setPageContent(content);
        // parseImages(content);
      });
    }
  }, [ article ]);

  useEffect(() => {
    if (!containerRef?.current) {
      return;
    }

    const handleScroll = () => {
      if (
        containerRef.current &&
        helpBarRef.current &&
        containerRef.current?.scrollTop > 300
      ) {
        console.log("111");
      }
    };

    containerRef.current.addEventListener("scroll", handleScroll);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
    <div className={ `${ styles.container } ${ styles.bgDot }` }>
      {/* {loading && <Loading />} */ }
      { article ? renderDetail() : renderPlaceholder() }
    </div>
  );
};
