import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import styles from './settingpanel.module.css';

function SettingPanel() {
  return (
    <div className={styles.container}>
      <h1 className={styles.subTitle}>设置</h1>

      <div className={styles.panelContainer}>
        <Tabs>
          <TabList>
            <Tab>订阅管理</Tab>
            <Tab>导入/导出</Tab>
            <Tab>代理设置</Tab>
            <Tab>其他</Tab>
          </TabList>

          <TabPanel>
            <h2>Any content 1</h2>
          </TabPanel>
          <TabPanel>
            <h2>Any content 2</h2>
          </TabPanel>
          <TabPanel>
            <h2>Any content 3</h2>
          </TabPanel>
          <TabPanel>
            <h2>Any content 4</h2>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}

export { SettingPanel };
