import React, { useCallback, useEffect, useRef } from 'react';
import Dayjs from 'dayjs';
import { Icon } from '../Icon';
import { openBrowser } from '../../../infra/utils';
import styles from './view.module.css';

function createMarkup(html: string) {
  return { __html: html };
}

export const ArticleView = (): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);

  const resetScrollTop = () => {
    if (containerRef.current !== null) {
      containerRef.current.scroll(0, 0);
    }
  };

  const renderPlaceholder = useCallback(() => {
    return <div className={styles.placeholder} />;
  }, []);

  const renderDetail = useCallback(() => {
    return (
      <React.Fragment key="detail">
        <div className={styles.toolbar}>
          <div className={`${styles.toolbarInner} ${styles.main}`}>
            <Icon name="done" customClass={styles.toolbarIcon} />
            <Icon name="bookmark-border" customClass={styles.toolbarIcon} />
            <Icon name="favorite" customClass={styles.toolbarIcon} />
            <Icon name="open-in-new" customClass={styles.toolbarIcon} />
          </div>
        </div>
        {false ? (
          <webview className={styles.frame} key="view" title="iframe" />
        ) : (
          <div className={`${styles.main} ${styles.main}`}>
            <div className={styles.header}>
              <div className={styles.title}>currentArticle.title</div>
              <div>
                {Dayjs().format('YYYY-MM-DD HH:mm')}
                currentArticle.author
              </div>
            </div>
            <div className={styles.body}>
              <div
                className={styles.content}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={createMarkup('')}
              />
              <button
                type="button"
                className={styles.browserButton}
                aria-hidden="true"
              >
                查看网站
              </button>
            </div>
          </div>
        )}
      </React.Fragment>
    );
  }, []);

  function handleGlobalClick(e: any) {
    if (e.target.nodeName.toLowerCase() === 'a' && e.target.href) {
      openBrowser(e.target.href);
      e.preventDefault();
    }
  }

  useEffect(() => {
    resetScrollTop();
  }, []);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
    <div
      className={styles.container}
      ref={containerRef}
      onClick={handleGlobalClick}
    >
      {false ? renderDetail() : renderPlaceholder()}
    </div>
  );
};
