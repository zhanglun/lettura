import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import * as routesConfig from '../../../infra/constants/routes';
import { Icon } from '../Icon';
import { channelStore } from '../../stores';
import { Channel } from '../../../infra/types';
import styles from './channel.module.css';

const ChannelList = observer(
  (): JSX.Element => {
    const [channelList, setChannelList]: [Channel[], any] = useState([]);

    function linkToRoute(name: string) {
      channelStore.setCurrentChannel(name);
      window.location.hash = name;
    }

    useEffect(() => {
      channelStore
        .getList()
        .then((list) => {
          return setChannelList(list);
        })
        .catch((e) => {});

      // channelStore
      //   .getArticleList()
      //   .then((list) => {
      //     console.log(list);
      //   })
      //   .catch((e) => {});
    });

    function renderFeedList(list: Channel[]): JSX.Element {
      return (
        <ul className={styles.list}>
          {list.map((channel: Channel, i: number) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <li className={styles.item} key={channel.title + i}>
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
          <span>{channelStore.currentChannel}</span>
          <div className={styles.toolbar}>
            <span className={styles.toolbarItem}>
              <Icon name="add" />
            </span>
            <span className={styles.toolbarItem}>
              <Icon name="folder" />
            </span>
            <span className={styles.toolbarItem}>
              <Icon name="refresh" />
            </span>
            <span
              className={styles.toolbarItem}
              onClick={() => {
                linkToRoute(routesConfig.SETTINGS);
              }}
              aria-hidden="true"
            >
              <Icon name="settings" />
            </span>
          </div>
        </div>
        <div className={styles.inner}>
          <div className={styles.official}>
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
          </div>
          {renderFeedList(channelList)}
        </div>
      </div>
    );
  }
);

export { ChannelList };
