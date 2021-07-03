import React from 'react';
import { Icon } from '../Icon';
import styles from './globaltoolbar.css';

export interface GlobalToolbarProps {
  title: string;
  id: string;
}

function GlobalToolbar(props: GlobalToolbarProps) {
  const { title } = props;

  return (
    <div className={styles.container}>
      <div className={styles.title}>{title}</div>
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
