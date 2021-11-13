import React, { useCallback, useEffect, useRef, useState } from 'react';
import Dayjs from 'dayjs';
import Mercury from '@postlight/mercury-parser';
import { Tooltip } from '@douyinfe/semi-ui';
import { Icon } from '../Icon';
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
  const { article } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageContent, setPageContent] = useState('');

  const resetScrollTop = () => {
    if (containerRef.current !== null) {
      containerRef.current.scroll(0, 0);
    }
  };

  const openInBrowser = useCallback(() => {
    if (article) openBrowser(article.link);
  }, [article]);

  function favoriteIt() {}

  const renderPlaceholder = useCallback(() => {
    return <div className={styles.placeholder} />;
  }, []);

  const renderDetail = useCallback(() => {
    return !article ? null : (
      <div className={`${styles.main} ${styles.main}`}>
        <div className={styles.helpBar}>
          <div className={styles.menu}>
            <Tooltip content="标记已读">
              <Icon
                customClass={`${styles.menuIcon}`}
                name="done"
                onClick={favoriteIt}
              />
            </Tooltip>
            <Tooltip content="标记未读">
              <Icon
                customClass={`${styles.menuIcon}`}
                name="radio_button_unchecked"
                onClick={favoriteIt}
              />
            </Tooltip>
            <Tooltip content="收藏">
              <Icon
                customClass={`${styles.menuIcon}`}
                name="favorite"
                onClick={favoriteIt}
              />
            </Tooltip>

            <Tooltip content="在浏览器中打开">
              <Icon
                customClass={`${styles.menuIcon}`}
                name="link"
                onClick={openInBrowser}
              />
            </Tooltip>
          </div>
        </div>
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
            dangerouslySetInnerHTML={createMarkup(pageContent)}
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
  }, [article, openInBrowser, pageContent]);

  function handleGlobalClick(e: any) {
    const { nodeName, href } = e.target;

    if (nodeName.toLowerCase() === 'a' && href) {
      openBrowser(href);
      e.preventDefault();
    }
  }

  useEffect(() => {
    resetScrollTop();

    if (article) {
      Mercury.parse(article.link)
        .then((page: any) => {
          console.log(page);
          setPageContent(page.content || article.content);

          return page;
        })
        .catch(() => {
          setPageContent(article.content);
        });
    }
  }, [article]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
    <div
      className={styles.container}
      ref={containerRef}
      onClick={handleGlobalClick}
    >
      {article ? renderDetail() : renderPlaceholder()}
    </div>
  );
};
