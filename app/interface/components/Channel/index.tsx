import React from 'react';
import styles from './channel.module.css';
import { Channel as IChannel } from '../../../infra/types';

export interface Props {
  channels: IChannel[];
}

function Channel(props: Props): JSX.Element {
  const { channels } = props;

  function renderChannelList(list: IChannel[]): JSX.Element {
    return (
      <ul className={styles.list}>
        {list.map((channel: IChannel, i: number) => {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <li className={styles.item} key={channel.name + i}>
              <img
                src={channel.icon}
                className={styles.icon}
                alt={channel.name}
              />
              <span className={styles.name}>{channel.name}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Feed</h1>
      </div>
      <div className={styles.inner}>{renderChannelList(channels)}</div>
    </div>
  );
}

export { Channel };
