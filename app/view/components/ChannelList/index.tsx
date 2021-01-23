import { remote } from 'electron';
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { observer } from 'mobx-react';
import { Icon } from '../Icon';
import { ChannelEntity } from '../../../entity/channel';
import { Channel } from '../../../infra/types';
import { ChannelType } from '../../../infra/constants/status';
import { StoreType, StoreContext } from '../../stores';

import styles from './channel.module.css';
import { MANUAL_SYNC_UNREAD } from '../../../event/constant';
import defaultSiteIcon from './default.png';

const ChannelList = observer(
  (): JSX.Element => {
    const { channelStore } = useContext(StoreContext) as StoreType;
    const [channelList, setChannelList] = useState<ChannelEntity[]>([]);
    const [unreadAmount, setUnreadAmount] = useState<number>(0);
    const { currentChannel } = channelStore;
    const history = useHistory();

    function viewChannel(channel: ChannelEntity) {
      channelStore.setCurrentChannel(channel);
      channelStore.setCurrentType('channel');

      history.push(`/channels/${channel.id}`);
    }

    function viewAll() {
      channelStore.setCurrentType(ChannelType.all);
      history.push('/all');
    }

    const syncRemoteArticle = useCallback(() => {
      remote.getCurrentWebContents().send(MANUAL_SYNC_UNREAD);
    }, []);

    function goToSettingPanel() {
      window.location.hash = 'settings';
    }

    async function getChannelList() {
      const list = await channelStore.getList();
      const amount = list.reduce((acu, cur) => {
        return acu + (cur.articleCount || 0);
      }, 0);

      setChannelList(list);
      setUnreadAmount(amount);
    }

    useEffect(() => {
      getChannelList();
    }, []);

    function renderFeedList(list: Channel[]): JSX.Element {
      return (
        <ul className={styles.list}>
          {list.map((channel: Channel, i: number) => {
            return (
              <li
                className={`${styles.item} ${
                  currentChannel &&
                  currentChannel.title === channel.title &&
                  styles.read
                }`}
                // eslint-disable-next-line react/no-array-index-key
                key={channel.title + i}
                onClick={() => {
                  viewChannel(channel);
                }}
                aria-hidden="true"
              >
                <img
                  src={channel.favicon}
                  onError={(e) => {
                    // @ts-ignore
                    e.target.onerror = null;

                    // @ts-ignore
                    e.target.src = defaultSiteIcon;
                  }}
                  className={styles.icon}
                  alt={channel.title}
                />
                <span className={styles.name}>{channel.title}</span>
                <span className={styles.count}>{channel.articleCount}</span>
              </li>
            );
          })}
        </ul>
      );
    }

    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.toolbar}>
            {/* <span className={styles.toolbarItem}> */}
            {/*  <Icon name="add" /> */}
            {/* </span> */}
            {/* <Icon name="create-new-folder" customClass={styles.toolbarItem} /> */}
            <Icon
              name="refresh"
              customClass={styles.toolbarItem}
              onClick={syncRemoteArticle}
            />
            <Icon
              name="settings"
              customClass={styles.toolbarItem}
              onClick={() => {
                goToSettingPanel();
              }}
              aria-hidden="true"
            />
          </div>
        </div>
        <div className={styles.inner}>
          <div className={styles.official}>
            <div
              className={styles.officialItem}
              onClick={() => {
                viewAll();
              }}
              aria-hidden="true"
            >
              <Icon
                customClass={styles.officialItemIcon}
                name="mark_email_unread"
              />
              <span className={styles.name}>所有未读</span>
              <span className={styles.count}>{unreadAmount}</span>
            </div>
            {/* <div */}
            {/*  className={styles.officialItem} */}
            {/*  onClick={() => { */}
            {/*    viewFavorite(); */}
            {/*  }} */}
            {/*  aria-hidden */}
            {/* > */}
            {/*  <Icon */}
            {/*    customClass={`${styles.officialItemIcon} ${styles.red}`} */}
            {/*    name="favorite-black" */}
            {/*  /> */}
            {/*  我的收藏 */}
            {/* </div> */}
          </div>
          {renderFeedList(channelList)}
        </div>
      </div>
    );
  }
);

export { ChannelList };
