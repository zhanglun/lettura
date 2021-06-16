import React from 'react';
import styles from './article.module.css';

const Toolbar = (props: any) => {
  const { channelName } = props;
  return <div className={styles.toolbar}>{channelName}</div>;
};

export { Toolbar };
