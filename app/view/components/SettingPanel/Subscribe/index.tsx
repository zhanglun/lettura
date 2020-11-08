import React, { useState, useEffect, useContext } from 'react';
import { parseRSS } from '../../../../infra/utils';
import { Channel } from '../../../../infra/types';
import { StoreType, StoreContext } from '../../../stores';
import styles from '../settingpanel.module.css';

const SettingSubscribe: () => React.ReactNode = () => {
  const [feedUrl, setFeedUrl] = useState('');
  const [feedRes, setFeedRes] = useState({} as Channel);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const { channelStore } = useContext(StoreContext) as StoreType;

  async function searchFeed() {
    setLoading(true);
    setRequested(false);
    // setFeedUrl('https://www.ifanr.com/feed');

    try {
      const feed = await parseRSS(feedUrl);
      setFeedRes(feed);
    } catch (e) {
      console.log(e);
    }

    setLoading(false);
    setRequested(true);
  }

  async function addFeed() {
    await channelStore.add(feedRes);
  }

  useEffect(() => {
    setFeedUrl('https://www.ifanr.com/feed');
  }, []);

  function showFeedInfo(): JSX.Element | string {
    if (!loading && requested) {
      return (
        <div className={styles.preview}>
          <img className={styles.previewIcon} src={feedRes.favicon} alt="" />
          <div className={styles.previewBody}>
            <div className={styles.previewHeader}>
              <button
                className={styles.previewFollowButton}
                type="button"
                onClick={() => addFeed()}
              >
                订阅
              </button>
              <p className={styles.previewTitle}>{feedRes.title}</p>
              <p className={styles.previewLink}>{feedRes.link}</p>
            </div>
            <p className={styles.previewDescription}>{feedRes.description}</p>
          </div>
        </div>
      );
    }

    if (loading) {
      return <div className={styles.previewLoading}>搜索中...</div>;
    }

    return '';
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>添加 RSS 源</h1>
      </div>
      <div className={styles.panelBody}>
        <div>
          <input
            type="text"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
          />
          <button type="button" onClick={searchFeed}>
            搜索
          </button>
        </div>
        {showFeedInfo()}
      </div>
    </div>
  );
};

export { SettingSubscribe };
