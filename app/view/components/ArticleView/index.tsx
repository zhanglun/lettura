import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
} from 'react';
import { observer } from 'mobx-react';
import Dayjs from 'dayjs';
import { Icon } from '../Icon';
import { openBrowser } from '../../../infra/utils';
import { StoreContext, StoreType } from '../../stores';
import styles from './view.module.css';

function createMarkup(html: string) {
  return { __html: html };
}

export const ArticleView = observer(
  (): JSX.Element => {
    const { articleStore } = useContext(StoreContext) as StoreType;
    const { currentArticle } = useMemo(() => articleStore, [articleStore]);
    const containerRef = useRef<HTMLDivElement>(null);

    const viewInBrowser = useCallback(() => {
      const { link } = currentArticle;
      openBrowser(link);
    }, [currentArticle]);

    const resetScrollTop = () => {
      if (containerRef.current !== null) {
        containerRef.current.scroll(0, 0);
      }
    };

    const renderPlaceholder = useCallback(() => {
      return <div className={styles.placeholder} />;
    }, []);

    const markArticleAsRead = useCallback(async () => {
      await articleStore.markArticleAsRead(currentArticle.id);
    }, [currentArticle, articleStore]);

    const renderDetail = useCallback(() => {
      return (
        <React.Fragment key="detail">
          <div className={styles.toolbar}>
            <div className={`${styles.toolbarInner} ${styles.main}`}>
              <Icon
                name="done"
                customClass={styles.toolbarIcon}
                onClick={markArticleAsRead}
              />
              <Icon name="bookmark-border" customClass={styles.toolbarIcon} />
              <Icon name="favorite" customClass={styles.toolbarIcon} />
              <Icon
                name="open-in-new"
                customClass={styles.toolbarIcon}
                onClick={() => viewInBrowser()}
              />
            </div>
          </div>
          {true ? (
            <webview
              className={styles.frame}
              key="view"
              title="iframe"
              src={currentArticle.link}
            />
          ) : (
            <div className={`${styles.main} ${styles.main}`}>
              <div className={styles.header}>
                <div className={styles.title}>{currentArticle.title}</div>
                <div>
                  {Dayjs(currentArticle.pubDate).format('YYYY-MM-DD HH:mm')}
                  {currentArticle.author}
                </div>
              </div>
              <div className={styles.body}>
                <div
                  className={styles.content}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={createMarkup(currentArticle.content)}
                />
                <button
                  type="button"
                  className={styles.browserButton}
                  onClick={() => {
                    viewInBrowser();
                  }}
                  aria-hidden="true"
                >
                  查看网站
                </button>
              </div>
            </div>
          )}
        </React.Fragment>
      );
    }, [currentArticle, markArticleAsRead, viewInBrowser]);

    function handleGlobalClick(e: any) {
      if (e.target.nodeName.toLowerCase() === 'a' && e.target.href) {
        openBrowser(e.target.href);
        e.preventDefault();
      }
    }

    useEffect(() => {
      resetScrollTop();
    }, [currentArticle]);

    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
      <div
        className={styles.container}
        ref={containerRef}
        onClick={handleGlobalClick}
      >
        {currentArticle && currentArticle.id
          ? renderDetail()
          : renderPlaceholder()}
      </div>
    );
  }
);
