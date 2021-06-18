import React, { useCallback } from 'react';
import { Icon } from '../Icon';
import { Channel } from '../../../infra/types';

import styles from './channel.module.css';
import defaultSiteIcon from './default.png';

const ChannelList = (): JSX.Element => {
  const renderFeedList = useCallback((list: Channel[]): JSX.Element => {
    return (
      <ul className={styles.list}>
        {list.map((channel: Channel, i: number) => {
          return (
            <li
              className={`${styles.item} &&
                  styles.read
                }`}
              // eslint-disable-next-line react/no-array-index-key
              key={channel.title + i}
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
            </li>
          );
        })}
      </ul>
    );
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.toolbar}>
          {/* <span className={styles.toolbarItem}> */}
          {/*  <Icon name="add" /> */}
          {/* </span> */}
          {/* <Icon name="create-new-folder" customClass={styles.toolbarItem} /> */}
          <Icon name="refresh" customClass={styles.toolbarItem} />
          <Icon
            name="settings"
            customClass={styles.toolbarItem}
            aria-hidden="true"
          />
        </div>
      </div>
      <div className={styles.inner}>
        <div className={styles.official}>
          <div className={styles.officialItem} aria-hidden="true">
            <Icon
              customClass={styles.officialItemIcon}
              name="mark_email_unread"
            />
            <span className={styles.name}>所有未读</span>
            <span className={styles.count}>{0}</span>
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
        {renderFeedList([])}
      </div>
    </div>
  );
};

export { ChannelList };
