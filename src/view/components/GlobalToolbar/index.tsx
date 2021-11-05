/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useState, useEffect, useCallback } from 'react';
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
  }, [id]);

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

  const markAllRead = useCallback(() => {
    const filter = {
      all: false,
      unread: true,
    };

    setListFilter(filter);
    onFilterList(filter);
    eventPubEmit.MARK_ARTICLE_READ_BY_CHANNEL({ channelId: id });
  }, []);

  useEffect(() => {
    eventPubOn.MARK_ARTICLE_READ_BY_CHANNEL(() => {
      handleRefresh();
    });
  }, []);

  return (
    <div className={`${styles.container} ${fixed && styles.fixed}`}>
      <div className={styles.title}>{title}</div>
      <div className={styles.menu}>
        <div
          className={`${styles.menuItem} ${listFilter.unread && styles.active}`}
          onClick={showUnread}
        >
          <Icon customClass={styles.menuIcon} name="done_all" />
          未读文章
        </div>
        <div
          className={`${styles.menuItem} ${listFilter.all && styles.active}`}
          onClick={showAll}
        >
          <Icon customClass={styles.menuIcon} name="done_all" />
          全部文章
        </div>
        <div className={styles.menuItem} onClick={markAllRead}>
          <Icon customClass={styles.menuIcon} name="done_all" />
          全部标记为已读
        </div>
        <div className={styles.menuItem} onClick={handleRefresh}>
          <Icon customClass={styles.menuIcon} name="refresh" />
          刷新
        </div>
      </div>
    </div>
  );
}

export { GlobalToolbar };
