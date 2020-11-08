import React, { useContext, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
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
    const { currentArticle } = articleStore;
    const containerRef = useRef<HTMLDivElement>(null);

    const viewInBrowser = () => {
      const { link } = currentArticle;
      openBrowser(link);
    };

    const resetScrollTop = () => {
      if (containerRef.current !== null) {
        containerRef.current.scroll(0, 0);
      }
    };

    function renderPlaceholder() {
      return <div className={styles.placeholder} />;
    }

    function renderDetail() {
      return (
        <React.Fragment key="detail">
          <div className={`${styles.toolbar} ${styles.main}`}>
            <Icon name="done" />
            <Icon name="bookmark-border" />
            <Icon name="favorite" />
            <Icon name="open-in-new" />
          </div>
          <div className={styles.main}>
            <div className={styles.header}>
              <div className={styles.title}>{currentArticle.title}</div>
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
        </React.Fragment>
      );
    }

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
        {/* <iframe */}
        {/*  className={styles.frame} */}
        {/*  key="view" */}
        {/*  title="iframe" */}
        {/*  src={currentArticle.link} */}
        {/*  frameBorder="0" */}
        {/* /> */}
      </div>
    );
  }
);
