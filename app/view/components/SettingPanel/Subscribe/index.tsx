import React, { useState, useEffect, useContext, useCallback } from 'react';
import { parseRSS } from '../../../../infra/utils';
import { ChannelRes, Channel } from '../../../../infra/types';
import { StoreType, StoreContext } from '../../../stores';
import styles from '../settingpanel.module.css';

export const SettingSubscribe: () => JSX.Element = () => {
  const [feedUrl, setFeedUrl] = useState('');
  const [channelRes, setChannelRes] = useState({} as ChannelRes);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { channelStore } = useContext(StoreContext) as StoreType;

  const validateChannelStatus = useCallback(async () => {
    const channel = await channelStore.findChannelByUrl(feedUrl);
    setSubscribed(!!channel);
  }, [feedUrl, channelStore]);
  const searchFeed = useCallback(async () => {
    setLoading(true);
    setRequested(false);

    try {
      await validateChannelStatus();
      const feed = await parseRSS(feedUrl);
      setChannelRes(feed);
    } catch (e) {
      console.log(e);
    }

    setLoading(false);
    setRequested(true);
  }, [feedUrl, validateChannelStatus]);
  const confirmSubscribe = useCallback(async () => {
    const { items } = channelRes;

    await channelStore.subscribeChannel(channelRes as Channel, items || []);
  }, [channelRes, channelStore]);

  useEffect(() => {
    setFeedUrl('https://www.ifanr.com/feed');
  }, []);

  const showFeedInfo = useCallback(() => {
    if (!loading && requested) {
      const button = subscribed ? (
        <button className={styles.previewFollowButton} type="button" disabled>
          已订阅
        </button>
      ) : (
        <button
          className={`${styles.previewFollowButton} button--primary`}
          type="button"
          onClick={() => confirmSubscribe()}
        >
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
            onChange={(e) => setFeedUrl(e.target.value)}
          />
          <button
            type="button"
            className="button button--primary"
            onClick={searchFeed}
          >
            搜索
          </button>
        </div>
        {showFeedInfo()}
      </div>
    </div>
  );
};
