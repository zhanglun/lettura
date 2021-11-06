import React, { useCallback, useEffect, useRef } from 'react';
import Dayjs from 'dayjs';
import { Article } from '../../../infra/types';
import { openBrowser } from '../../../infra/utils';
import styles from './view.module.css';

type ArticleViewProps = {
  article: Article | null;
};

function createMarkup(html: string) {
  return { __html: html };
}

export const ArticleView = (props: ArticleViewProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { article } = props;

  const resetScrollTop = () => {
    if (containerRef.current !== null) {
      containerRef.current.scroll(0, 0);
    }
  };

  const openInBrowser = useCallback(() => {
    if (article) openBrowser(article.link);
  }, [article]);

  const renderPlaceholder = useCallback(() => {
    return <div className={styles.placeholder} />;
  }, []);

  const renderDetail = useCallback(() => {
    return !article ? null : (
      <div className={`${styles.main} ${styles.main}`}>
        <div className={styles.header}>
          <div className={styles.title}>{article.title}</div>
          <div className={styles.meta}>
            <span className={styles.time}>
              {Dayjs().format('YYYY-MM-DD HH:mm')}
            </span>
            <span className={styles.author}>{article.author}</span>
            <span className={styles.channelInfo}>
              <img src={article.channelFavicon} alt="" />
              {article.channelTitle}
            </span>
          </div>
        </div>
        <div className={styles.body}>
          <div
            className={styles.content}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={createMarkup(article.content)}
          />
          <button
            type="button"
            className={styles.browserButton}
            aria-hidden="true"
            onClick={openInBrowser}
          >
            查看网站
          </button>
        </div>
      </div>
    );
  }, [article]);

  function handleGlobalClick(e: any) {
    if (e.target.nodeName.toLowerCase() === 'a' && e.target.href) {
      openBrowser(e.target.href);
      e.preventDefault();
    }
  }

  useEffect(() => {
    resetScrollTop();
  }, [article]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
    <div
      className={styles.container}
      ref={containerRef}
      onClick={handleGlobalClick}
    >
      {article ? renderDetail() : renderPlaceholder()}
      <div>
        asdfasdf
      </div>
    </div>
  );
};
