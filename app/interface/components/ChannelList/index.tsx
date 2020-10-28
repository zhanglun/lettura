import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Icon } from '../Icon';
import { channelStore } from '../../stores';
import { Channel } from '../../../infra/types';
import styles from './channel.module.css';

const ChannelList = observer(
  (): JSX.Element => {
    const [channelList, setChannelList] = useState<Channel[]>([]);
    const { currentChannel } = channelStore;

    function viewChannel(channel: Channel) {
      channelStore.setCurrentChannel(channel);
      window.location.hash = `/channels/${channel.title}`;
    }

    function goToSettingPanel() {
      window.location.hash = 'settings';
    }

    async function getChannelList() {
      const list = await channelStore.getList();
      setChannelList(list);
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
                  styles.itemReaded
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
                  className={styles.icon}
                  alt={channel.title}
                />
                <span className={styles.name}>{channel.title}</span>
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
            <span className={styles.toolbarItem}>
              <Icon name="folder" />
            </span>
            <span className={styles.toolbarItem}>
              <Icon name="refresh" />
            </span>
            <span
              className={styles.toolbarItem}
              onClick={() => {
                goToSettingPanel();
              }}
              aria-hidden="true"
            >
              <Icon name="settings" />
            </span>
          </div>
        </div>
        <div className={styles.inner}>
          {/* <div className={styles.official}>
            <div
              className={styles.officialItem}
              onClick={() => {
                linkToRoute(routesConfig.HOME);
              }}
              aria-hidden="true"
            >
              <Icon
                customClass={styles.officialItemIcon}
                name="mark_email_unread"
              />
              所有未读
            </div>
            <div
              className={styles.officialItem}
              onClick={() => {
                linkToRoute(routesConfig.TODAY);
              }}
              aria-hidden
            >
              <Icon
                customClass={`${styles.officialItemIcon} ${styles.orange}`}
                name="calendar_today"
              />
              今日未读
            </div>
            <div
              className={styles.officialItem}
              onClick={() => {
                linkToRoute(routesConfig.FAVORITE);
              }}
              aria-hidden
            >
              <Icon
                customClass={`${styles.officialItemIcon} ${styles.red}`}
                name="favorite-black"
              />
              我的收藏
            </div>
          </div> */}
          {renderFeedList(channelList)}
        </div>
      </div>
    );
  }
);

export { ChannelList };
