import React, { useState, useEffect, useCallback } from 'react';
import { Input, Button } from '@douyinfe/semi-ui';
import { getRSSByFetch } from '../../../../infra/utils';
import { ChannelRes } from '../../../../infra/types';
import { useEventPub } from '../../../hooks/useEventPub';
import styles from '../settingpanel.module.css';
import { Toast } from '../../Toast';

export const SettingSubscribe: () => JSX.Element = () => {
  const { eventPubEmit } = useEventPub();
  const [feedUrl, setFeedUrl] = useState('');
  const [channelRes, setChannelRes] = useState({} as ChannelRes);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const searchFeed = useCallback(async () => {
    setLoading(true);
    setRequested(false);

    try {
      const feed = await getRSSByFetch(feedUrl);

      setChannelRes(feed);
    } catch (err) {
      Toast.show({
        type: 'error',
        title: err.message,
      });
    }

    setLoading(false);
    setRequested(true);
  }, [feedUrl]);

  const confirmSubscribe = useCallback(async () => {
    eventPubEmit.SUBSCRIBE(channelRes);
  }, [channelRes, eventPubEmit]);

  useEffect(() => {
    setFeedUrl('https://www.ifanr.com/feed');
  }, []);

  const showFeedInfo = useCallback(() => {
    if (!loading && requested) {
      const button = subscribed ? (
        <Button disabled theme="solid" type="warning">
          已订阅
        </Button>
      ) : (
        <Button theme="solid" type="primary" onClick={() => confirmSubscribe()}>
          订阅
        </Button>
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
          <Input
            type="text"
            className="input"
            value={feedUrl}
            placeholder="请输入订阅源"
            onChange={(value) => setFeedUrl(value)}
          />
          <Button theme="solid" type="primary" onClick={searchFeed}>
            搜索
          </Button>
        </div>
        {showFeedInfo()}
      </div>
    </div>
  );
};
