import React from 'react';
import { SettingSubscribe } from './Subscribe';
import { ImportAndExport } from './ImportAndExport';
import styles from './settingpanel.module.css';

function SettingPanel() {
  return (
    <div className={styles.container}>
      <h1 className={styles.subTitle}>设置</h1>
      <div className={styles.panelContainer}>
        <SettingSubscribe />
        <ImportAndExport />
      </div>
    </div>
  );
}

export { SettingPanel };
