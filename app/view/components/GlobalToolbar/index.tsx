import React from 'react';
import { Icon } from '../Icon';
import styles from './toolbar.module.css';

export interface GlobalToolbarProps {
  feedName: string;
  feedId: number;
  unReadCount: number;
}

function GlobalToolbar(props: GlobalToolbarProps) {
  const { feedName } = props;

  return (
    <div className={styles.container}>
      <div className={styles.feedName}>
        {feedName || '原创频道》什么值得买'}
      </div>
      <div className={styles.menu}>
        <div className={styles.menuItem}>
          <Icon customClass={styles.menuIcon} name="done_all" />
          全部标记为已读
        </div>
        <div className={styles.menuItem}>
          <Icon customClass={styles.menuIcon} name="refresh" />
          刷新
        </div>
      </div>
    </div>
  );
}

export { GlobalToolbar };
