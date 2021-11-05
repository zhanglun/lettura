import React from 'react';
import { Tabs, TabPane } from '@douyinfe/semi-ui';
import { SettingSubscribe } from './Subscribe';
import { ImportAndExport } from './ImportAndExport';
import { MainHeader } from '../MainHeader';
import styles from './settingpanel.module.css';

function SettingPanel() {
  return (
    <div className={styles.container}>
      <MainHeader title="设置" />
      <div className={styles.panelContainer}>
        <Tabs type="line">
          <TabPane tab="订阅管理" itemKey="1">
            TODO
          </TabPane>
          <TabPane tab="导入/导出" itemKey="2">
            <SettingSubscribe />
            <ImportAndExport />
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
}

export { SettingPanel };
