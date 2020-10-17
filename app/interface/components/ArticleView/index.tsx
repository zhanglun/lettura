import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import styles from './view.module.css';
import { channelStore } from '../../stores';

function createMarkup(html: string) {
  return { __html: html };
}

export const ArticleView = observer(
  (): JSX.Element => {
    const currentArticle = channelStore.currenArticle;

    return (
      <div className={styles.container}>
        <div>{currentArticle.title}</div>
        <div dangerouslySetInnerHTML={createMarkup()} />
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
