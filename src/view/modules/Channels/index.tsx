import React from 'react';
import { ChannelList } from '../../components/ChannelList';
import styles from './index.module.css';

export const ChannelModule = () => {
  return (
    <div className={styles.channel}>
      <ChannelList />
    </div>
  );
};
