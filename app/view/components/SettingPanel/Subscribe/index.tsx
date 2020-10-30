import React, { useState, useEffect } from 'react';
import { parseRSS } from '../../../../infra/utils';
import { channelStore } from '../../../stores';
import styles from '../settingpanel.module.css';

const SettingSubscribe: () => React.ReactNode = () => {
  const [feedUrl, setFeedUrl] = useState('');

  async function addFeed() {
    const feed = await parseRSS(feedUrl);
    channelStore.add(feed);
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>添加 RSS 源</h1>
      </div>
      <div className={styles.panelBody}>
        <input
          type="text"
          value={feedUrl}
          onChange={(e) => setFeedUrl(e.target.value)}
        />
        <button type="button" onClick={addFeed}>
          搜索
        </button>
      </div>
    </div>
  );
};

export { SettingSubscribe };
