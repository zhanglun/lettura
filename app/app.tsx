import React from 'react';
import { Channel } from './interface/components/Channel';
import { ArticleList } from './interface/components/ArticleList';
import { Channel as IChannel, Article as IArticle } from './infra/types/index';
import styles from './app.module.css';
import { channelList, articleList } from './infra/mock';

function App() {
  const channels: IChannel[] = channelList;
  const articles: IArticle[] = articleList;

  return (
    <div className={styles.container}>
      <div className={styles.channel}>
        <Channel channels={channels} />
      </div>
      <div className={styles.articleList}>
        <ArticleList articleList={articles} />
      </div>
      <div className={styles.reader} />
    </div>
  );
}

export default App;
