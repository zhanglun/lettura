/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useState, useEffect, useCallback } from 'react';
import { useEventPub } from '../../hooks/useEventPub';
import { Icon } from '../Icon';
import styles from './globaltoolbar.css';

export interface GlobalToolbarProps {
  title: string;
  id: string;
}

function GlobalToolbar(props: GlobalToolbarProps) {
  const { title, id } = props;
  const { eventPubEmit } = useEventPub();
  const [fixed, setFixed] = useState(false);

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
    eventPubEmit.syncArticlesInCurrentChannel({ channelId: id });
  }, [id]);

  return (
    <div className={`${styles.container} ${fixed && styles.fixed}`}>
      <div className={styles.title}>{title}</div>
      <div className={styles.menu}>
        <div className={styles.menuItem}>
          <Icon customClass={styles.menuIcon} name="done_all" />
          全部标记为已读
        </div>
        <div className={styles.menuItem}>
          <Icon customClass={styles.menuIcon} name="done_all" />
          未读文章
        </div>
        <div className={styles.menuItem}>
          <Icon customClass={styles.menuIcon} name="done_all" />
          全部文章
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
