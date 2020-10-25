import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { openBrowser } from '../../../infra/utils';
import { channelStore } from '../../stores';
import styles from './view.module.css';

function createMarkup(html: string) {
  return { __html: html };
}

export const ArticleView = observer(
  (): JSX.Element => {
    const currentArticle = channelStore.currenArticle;

    const viewInBrowser = () => {
      const { link } = currentArticle;
      openBrowser(link);
    };

    return (
      <div className={styles.container}>
        <div className={`${styles.toolbar} ${styles.main}`} />
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

        {/* <iframe
          className={styles.frame}
          key="view"
          title="iframe"
          src={currentArticle.link}
          frameBorder="0"
        /> */}
      </div>
    );
  }
);
