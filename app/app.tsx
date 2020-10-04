import React from 'react';
import { Channel } from './components/Channel';
import { Channel as IChannel } from './infra/types/index';
import styles from './app.module.css';
import { channelList } from './infra/mock';

function App() {
  const channels: IChannel[] = channelList;

  console.log(channelList);

  return (
    <div className={styles.container}>
      <div className={styles.channel}>
        <Channel channels={channels} />
      </div>
      <div className={styles.articleList} />
      <div className={styles.reader} />
    </div>
  );
}

export default App;
