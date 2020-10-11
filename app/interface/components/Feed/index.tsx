import React from 'react';
import * as routesConfig from '../../../infra/constants/routes';
import { Icon } from '../Icon';
import styles from './feed.module.css';
import { Feed as IFeed } from '../../../infra/types';

export interface Props {
  feeds: IFeed[];
}

function Feed(props: Props): JSX.Element {
  const { feeds } = props;

  function linkToRoute(name: string) {
    window.location.hash = name;
  }

  function renderFeedList(list: IFeed[]): JSX.Element {
    return (
      <ul className={styles.list}>
        {list.map((feed: IFeed, i: number) => {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <li className={styles.item} key={feed.name + i}>
              <img src={feed.icon} className={styles.icon} alt={feed.name} />
              <span className={styles.name}>{feed.name}</span>
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
        {renderFeedList(feeds)}
      </div>
    </div>
  );
}

export { Feed };
