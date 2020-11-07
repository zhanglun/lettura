import React, { useState, useEffect, useContext } from 'react';
import { observer } from 'mobx-react';
import { Icon } from '../Icon';
import { Channel } from '../../../infra/types';
import { Channel as ChannelEntity } from '../../../entity/channel';
import { StoreType, StoreContext } from '../../stores';

import styles from './channel.module.css';

const ChannelList = observer(
  (): JSX.Element => {
    const { channelStore } = useContext(StoreContext) as StoreType;
    const [channelList, setChannelList] = useState<ChannelEntity[]>([]);
    const currentChannel = {
      title: '',
    };

    function viewChannel(channel: ChannelEntity) {
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

    function renderFeedList(list: ChannelEntity[]): JSX.Element {
      return (
        <ul className={styles.list}>
          {list.map((channel: ChannelEntity, i: number) => {
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
              <Icon name="create-new-folder" />
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
