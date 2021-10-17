import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { useEventPub } from '../../hooks/useEventPub';
import { Channel } from '../../../infra/types';
import * as EventDict from '../../../event/constant';
import * as Routes from '../../../infra/constants/routes';
import { Icon } from '../Icon';
import styles from './channel.module.css';
import defaultSiteIcon from './default.png';
import { useDataProxy } from '../../hooks/useDataProxy';

const ChannelList = (): JSX.Element => {
  const history = useHistory();
  const dataProxy = useDataProxy();
  const { on: eventOn } = useEventPub();
  const [channelList, setChannelList] = useState([]);
  const [currentId, setCurrentId] = useState('');
  const [sum, setSum] = useState(0);

  const initial = () => {
    dataProxy
      .getChannelList()
      .then((result) => {
        console.log(result);
        const total = result.reduce((acu: number, cur: Channel) => {
          return acu + (cur.articleCount || 0);
        }, 0);
        setSum(total);
        setChannelList(result);
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const goToSetting = () => {
    history.push(Routes.SETTINGS);
  };

  const refreshList = () => {
    initial();
  };

  const viewArticles = (channel: Channel) => {
    setCurrentId(channel.id);

    history.push(
      `${Routes.CHANNEL.replace(/:name/, channel.title)}?channelId=${
        channel.id
      }`
    );
  };

  const viewInbox = () => {
    history.push(`${Routes.CHANNEL.replace(/:name/, 'Inbox')}?channelId=inbox`);
  };

  const renderFeedList = useCallback((): JSX.Element => {
    return (
      <ul className={styles.list}>
        {channelList.map((channel: Channel, i: number) => {
          return (
            <li
              className={`${styles.item} ${
                currentId === channel.id ? styles.itemActive : ''
              }`}
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
              <span className={styles.count}>{channel.articleCount}</span>
            </li>
          );
        })}
      </ul>
    );
  }, [currentId]);

  useEffect(() => {
    initial();

    eventOn(EventDict.SUBSCRIBE, () => {
      initial();
    });
  }, []);

  useEffect(() => {
    setCurrentId(channelList[0]);
  }, [channelList]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.toolbar}>
          <Icon name="add" customClass={styles.toolbarItem} />
          <Icon name="folder" customClass={styles.toolbarItem} />
          <Icon
            name="refresh"
            customClass={styles.toolbarItem}
            onClick={refreshList}
          />
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
          <div
            className={styles.officialItem}
            aria-hidden="true"
            onClick={() => viewInbox()}
          >
            <Icon
              customClass={styles.officialItemIcon}
              name="mark_email_unread"
            />
            <span className={styles.name}>Inbox</span>
            <span className={styles.count}>{sum}</span>
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
