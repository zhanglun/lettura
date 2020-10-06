import React from 'react';
import { Icon } from '../Icon';
import styles from './toolbar.module.css';

function GlobalToolbar() {
  return (
    <div className={styles.container}>
      <span>
        <Icon name="settings" />
      </span>
    </div>
  );
}

export { GlobalToolbar };
