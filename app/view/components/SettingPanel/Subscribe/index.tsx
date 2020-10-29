import React, { useState, useEffect } from 'react';
import styles from '../settingpanel.module.css';
import { channelStore } from '../../../stores';

const SettingSubscribe: () => React.ReactNode = () => {
  const [feedUrl, setFeedUrl] = useState('');

  function addFeed() {
    channelStore.add(feedUrl);
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
          添加
        </button>
      </div>
    </div>
  );
};

export { SettingSubscribe };
