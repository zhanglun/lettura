import React, { useEffect, useRef, useState } from "react";
import Dayjs from "dayjs";
import styles from "./view.module.scss";
import { getChannelFavicon } from "../../helpers/parseXML";

type ArticleViewProps = {
  article: any | null;
};

function createMarkup(html: string) {
  return { __html: html };
}

export const ArticleView = (props: ArticleViewProps): JSX.Element => {
  const { article } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const helpBarRef = useRef<HTMLDivElement>(null);
  const [pageContent, setPageContent] = useState("");
  const [showBanner, setShowBanner] = useState(false);

  const renderPlaceholder = () => {
    return "";
  };

  const renderDetail = () => {
    if (!article) {
      return null;
    }

    const { link, pub_date } = article;
    const ico = getChannelFavicon(link);

    return (
      <div className={styles.inner} ref={containerRef}>
        <div className={styles.main}>
          <div className={styles.header}>
            <div className={styles.title}>{article.title}</div>
            <div className={styles.meta}>
              <span className={styles.time}>
                {Dayjs(pub_date).format("YYYY-MM-DD HH:mm")}
              </span>
              <span className={styles.author}>{article.author}</span>
              <span className={styles.channelInfo}>
                <img src={ico} alt=""/>
                {article.channelTitle}
              </span>
            </div>
          </div>
          <div className={styles.body}>
            {showBanner && article.image &&  <div className={styles.banner}><img src={article.image} alt=""/></div>}
            <div
              className={styles.content}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={createMarkup(pageContent)}
            />
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (article) {
      const content = (article.content || article.description || "").replace(
        /<a[^>]+>/gi,
        (a: string) => {
          if (!/\starget\s*=/gi.test(a)) {
            return a.replace(/^<a\s/, '<a target="_blank"');
          }

          return a;
        }
      );

      if (article.image && content.includes(article.image.split('/').slice(-1)[0])){
        setShowBanner(false)
      } else {
        setShowBanner(true)
      }

      setPageContent(content);
    }
  }, [article]);

  useEffect(() => {
    if (!containerRef || !containerRef.current) {
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
    <div className={`${styles.container} ${styles.bgDot}`}>
      {/* {loading && <Loading />} */}
      {article ? renderDetail() : renderPlaceholder()}
    </div>
  );
};
