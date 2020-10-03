import React from 'react';
import styles from './channel.module.css';
import { Channel as IChannel } from '../../infra/types';

export interface Props {
  channels: IChannel[];
}

function Channel(props: Props): JSX.Element {
  const { channels } = props;

  function renderChannelList(list: IChannel[]): JSX.Element {
    return (
      <ul className={styles.list}>
        {list.map((channel: IChannel) => {
          return (
            <li className={styles.channelItem} key={channel.name}>
              {channel.name}
            </li>
          );
        })}
      </ul>
    );
  }

  return <div className={styles.container}>{renderChannelList(channels)}</div>;
}

export { Channel };
