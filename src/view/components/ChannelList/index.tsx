import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useEventPub } from '../../hooks/useEventPub';
import { useDataProxy } from '../../hooks/useDataProxy';
import { GlobalContext } from '../../hooks/context';
import { Channel } from '../../../infra/types';
import * as Routes from '../../../infra/constants/routes';
import { Icon } from '../Icon';
import styles from './channel.module.css';
import defaultSiteIcon from './default.png';

const ChannelList = (): JSX.Element => {
  const history = useHistory();
  const dataProxy = useDataProxy();
  const context = useContext(GlobalContext);
  const { eventPubOn } = useEventPub();
  const [channelList, setChannelList] = useState([]);
  const [currentId, setCurrentId] = useState('');
  const [sum, setSum] = useState(0);
  const [todayUnread, setTodayUnread] = useState(0);

  const initial = () => {
    dataProxy
      .PROXY_GET_CHANNEL_LIST()
      .then((result) => {
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

    dataProxy
      .PROXY_GET_UNREAD_TOTAL()
      .then((result) => {
        result.forEach((item: { channelId: string; total: number }) => {
          if (item.channelId === 'today') {
            setTodayUnread(item.total);
          }

          if (item.channelId === 'inbox') {
            setSum(item.total);
          }
        });

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

  const viewArticles = useCallback(
    (channel: Channel) => {
      setCurrentId(channel.id);

      context.currentChannelId = channel.id;
      context.currentChannel = channel;

      history.push(
        `${Routes.CHANNEL.replace(/:name/, channel.title)}?channelId=${
          channel.id
        }`
      );
    },
    [history]
  );

  const viewInbox = () => {
    history.push(
      `${Routes.CHANNEL.replace(/:name/, '所有文章')}?channelId=inbox`
    );
  };

  const viewToday = () => {
    history.push(
      `${Routes.CHANNEL.replace(/:name/, '今日未读')}?channelId=today`
    );
  };

  const renderFeedList = useCallback((): JSX.Element => {
    return (
      <ul className={styles.list}>
        {channelList.map(
          (channel: Channel & { articlaCount: number }, i: number) => {
            const { articleCount = 0 } = channel;

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
                {articleCount > 0 && (
                  <span className={styles.count}>{articleCount}</span>
                )}
              </li>
            );
          }
        )}
      </ul>
    );
  }, [currentId, channelList, viewArticles]);

  useEffect(() => {
    initial();

    eventPubOn.SUBSCRIBE(() => {
      initial();
    });

    eventPubOn.MANUAL_SYNC_UNREAD_WITH_CHANNEL_ID(() => {});
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
              customClass={`${styles.officialItemIcon} ${styles.iconUnread}`}
              name="inbox"
            />
            <span className={styles.name}>所有文章</span>
            <span className={styles.count}>{sum}</span>
          </div>
          <div
            className={styles.officialItem}
            aria-hidden="true"
            onClick={() => viewToday()}
          >
            <Icon
              customClass={`${styles.officialItemIcon} ${styles.iconToday}`}
              name="calendar_today"
            />
            <span className={styles.name}>今日未读</span>
            <span className={styles.count}>{todayUnread}</span>
          </div>
        </div>
        {renderFeedList()}
      </div>
    </div>
  );
};

export { ChannelList };
