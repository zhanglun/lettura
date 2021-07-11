import React from 'react';
import { SettingSubscribe } from './Subscribe';
import { ImportAndExport } from './ImportAndExport';
import { MainHeader } from '../MainHeader';
import styles from './settingpanel.module.css';

function SettingPanel() {
  return (
    <div className={styles.container}>
      <MainHeader title="设置" />
      <div className={styles.panelContainer}>
        <SettingSubscribe />
        <ImportAndExport />
      </div>
    </div>
  );
}

export { SettingPanel };
