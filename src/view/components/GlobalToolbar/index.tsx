import React, { useState, useEffect } from 'react';

import { Icon } from '../Icon';
import styles from './globaltoolbar.css';

export interface GlobalToolbarProps {
  title: string;
  id: string;
}

function GlobalToolbar(props: GlobalToolbarProps) {
  const { title } = props;
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

  return (
    <div className={`${styles.container} ${fixed && styles.fixed}`}>
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
