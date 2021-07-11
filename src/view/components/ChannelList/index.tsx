import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Channel } from '../../../infra/types';
import * as Routes from '../../../infra/constants/routes';
import { Icon } from '../Icon';
import styles from './channel.module.css';
import defaultSiteIcon from './default.png';
import { useDataProxy } from '../../hooks/useDataProxy';

const ChannelList = (): JSX.Element => {
  const history = useHistory();
  const dataProxy = useDataProxy();
  const [channelList, setChannelList] = useState([]);

  const goToSetting = () => {
    history.push(Routes.SETTINGS);
  };

  const viewArticles = (channel: Channel) => {
    history.push(
      `${Routes.CHANNEL.replace(/:name/, channel.title)}?channelId=${
        channel.id
      }`
    );
  };

  const renderFeedList = (): JSX.Element => {
    return (
      <ul className={styles.list}>
        {channelList.map((channel: Channel, i: number) => {
          return (
            <li
              className={`${styles.item}`}
              // eslint-disable-next-line react/no-array-index-key
              key={channel.title + i}
              onClick={() => viewArticles(channel)}
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
  };

  useEffect(() => {
    dataProxy
      .getChannelList()
      .then((result) => {
        setChannelList(result);
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
  }, [setChannelList]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.toolbar}>
          <Icon name="add" customClass={styles.toolbarItem} />
          <Icon name="folder" customClass={styles.toolbarItem} />
          <Icon name="refresh" customClass={styles.toolbarItem} />
          <Icon
            name="settings"
            customClass={styles.toolbarItem}
            onClick={goToSetting}
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
            <span className={styles.name}>Inbox</span>
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
        {renderFeedList()}
      </div>
    </div>
  );
};

export { ChannelList };
