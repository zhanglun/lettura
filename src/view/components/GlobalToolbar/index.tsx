/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useState, useEffect, useCallback } from 'react';
import { Tooltip, Dropdown } from '@douyinfe/semi-ui';
import { useEventPub } from '../../hooks/useEventPub';
import { Icon } from '../Icon';
import styles from './globaltoolbar.css';

export type ListFilter = {
  all?: boolean;
  unread?: boolean;
  read?: boolean;
};

export interface GlobalToolbarProps {
  title: string;
  id: string;
  onFilterList: (filter: ListFilter) => void;
}

function GlobalToolbar(props: GlobalToolbarProps) {
  const { title, id, onFilterList } = props;
  const { eventPubEmit, eventPubOn } = useEventPub();
  const [fixed, setFixed] = useState(false);
  const [listFilter, setListFilter] = useState<ListFilter>({
    unread: true,
  });

  useEffect(() => {
    const $container = document.querySelector('#appMain');

    $container?.addEventListener(
      'scroll',
      () => {
        if ($container.scrollTop > 0) {
          setFixed(true);
        } else {
          setFixed(false);
        }
      },
      true
    );
  }, []);

  const handleRefresh = useCallback(() => {
    eventPubEmit.MANUAL_SYNC_UNREAD_WITH_CHANNEL_ID({ channelId: id });
  }, [id, eventPubEmit]);

  const showAll = useCallback(() => {
    const filter = {
      all: true,
      unread: false,
    };

    setListFilter(filter);
    onFilterList(filter);
  }, [onFilterList]);

  const showUnread = useCallback(() => {
    const filter = {
      all: false,
      unread: true,
    };

    setListFilter(filter);
    onFilterList(filter);
  }, [onFilterList]);

  const showRead = useCallback(() => {
    const filter = {
      all: false,
      unread: false,
      read: true,
    };

    setListFilter(filter);
    onFilterList(filter);
  }, [onFilterList]);

  const markAllRead = useCallback(() => {
    const filter = {
      all: false,
      unread: true,
    };

    setListFilter(filter);
    onFilterList(filter);
    eventPubEmit.MARK_ARTICLE_READ_BY_CHANNEL({ channelId: id });
  }, [id, onFilterList, eventPubEmit]);

  function favoriteIt() {}

  useEffect(() => {
    eventPubOn.MARK_ARTICLE_READ_BY_CHANNEL(() => {
      handleRefresh();
    });
  }, [eventPubOn, handleRefresh]);

  return (
    <div className={`${styles.container} ${fixed && styles.fixed}`}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <div className={styles.menu}>
          <Icon
            customClass={styles.menuIcon}
            name="checklist"
            onClick={markAllRead}
          />
          <Icon
            customClass={styles.menuIcon}
            name="refresh"
            onClick={handleRefresh}
          />
          <Dropdown
            clickToHide
            trigger="click"
            position="bottomRight"
            render={
              <Dropdown.Menu>
                <Dropdown.Item active={listFilter.unread}>
                  <span
                    className={`${listFilter.unread && styles.active}`}
                    onClick={showUnread}
                  >
                    未读文章
                  </span>
                </Dropdown.Item>
                <Dropdown.Item active={listFilter.read}>
                  <span
                    className={`${listFilter.read && styles.active}`}
                    onClick={showRead}
                  >
                    已读文章
                  </span>
                </Dropdown.Item>
                <Dropdown.Item active={listFilter.all}>
                  <span
                    className={`${listFilter.all && styles.active}`}
                    onClick={showAll}
                  >
                    全部文章
                  </span>
                </Dropdown.Item>
              </Dropdown.Menu>
            }
          >
            <span>
              <Icon customClass={styles.menuIcon} name="filter_alt" />
            </span>
          </Dropdown>
        </div>
      </div>
      <div className={styles.menu}>
        <Tooltip content="标记已读">
          <Icon
            customClass={`${styles.menuIcon}`}
            name="done"
            onClick={favoriteIt}
          />
        </Tooltip>
        <Tooltip content="标记未读">
          <Icon
            customClass={`${styles.menuIcon}`}
            name="radio_button_unchecked"
            onClick={favoriteIt}
          />
        </Tooltip>
        <Tooltip content="收藏">
          <Icon
            customClass={`${styles.menuIcon}`}
            name="favorite"
            onClick={favoriteIt}
          />
        </Tooltip>

        <Tooltip content="在浏览器中打开">
          <Icon
            customClass={`${styles.menuIcon}`}
            name="link"
            onClick={handleRefresh}
          />
        </Tooltip>
      </div>
    </div>
  );
}

export { GlobalToolbar };
