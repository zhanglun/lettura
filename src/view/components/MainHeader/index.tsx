import React from 'react';
import styles from './header.module.css';

type MainHeaderProps = {
  title: string;
};

export const MainHeader = (props: MainHeaderProps) => {
  const { title } = props;

  return (
    <div className={styles.container}>
      <div className={styles.title}>{title}</div>
    </div>
  );
};
