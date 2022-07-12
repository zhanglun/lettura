import React, { useState, useEffect, useCallback } from 'react';
import styles from '../settingpanel.module.css';
import { Toast } from '../../Toast';

export const SettingSubscribe: () => JSX.Element = () => {
  const [feedUrl, setFeedUrl] = useState('');
  const [channelRes, setChannelRes] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const searchFeed = useCallback(async () => {
    setLoading(true);
    setRequested(false);
    // TODO: 参数传给tauri
  }, [feedUrl]);

  const confirmSubscribe = async () => {
  };

  useEffect(() => {
    setFeedUrl('https://www.ifanr.com/feed');
  }, []);

  const showFeedInfo = useCallback(() => {
    if (!loading && requested) {
      const button = subscribed ? (
        <button disabled>
          已订阅
        </button>
      ) : (
        <button onClick={() => confirmSubscribe()}>
          订阅
        </button>
      );

      return (
        <div className={styles.preview}>
          <img className={styles.previewIcon} src={channelRes.favicon} alt="" />
          <div className={styles.previewBody}>
            <div className={styles.previewHeader}>
              {button}
              <p className={styles.previewTitle}>{channelRes.title}</p>
              <p className={styles.previewLink}>{channelRes.link}</p>
            </div>
            <p className={styles.previewDescription}>
              {channelRes.description}
            </p>
          </div>
        </div>
      );
    }

    if (loading) {
      return <div className={styles.previewLoading}>搜索中...</div>;
    }

    return '';
  }, [channelRes, loading, requested]);

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>添加 RSS 源</h1>
      </div>
      <div className={styles.panelBody}>
        <div className="flex align-items-center">
          <input
            type="text"
            className="input"
            value={feedUrl}
            placeholder="请输入订阅源"
            // @ts-ignore
            onChange={(value) => setFeedUrl(value)}
          />
          <button onClick={searchFeed}>
            搜索
          </button>
        </div>
        {showFeedInfo()}
      </div>
    </div>
  );
};
