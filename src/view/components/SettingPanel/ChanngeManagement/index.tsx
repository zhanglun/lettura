/* eslint-disable react/display-name */
import React, { useState, useEffect } from 'react';
import { Table } from '@douyinfe/semi-ui';
import Dayjs from 'dayjs';
import { Icon } from '../../Icon';
import { useDataProxy } from '../../../hooks/useDataProxy';
import { useEventPub } from '../../../hooks/useEventPub';
import { ChannelEntity } from '../../../../entity/channel';
import styles from './index.module.css';
import { openBrowser } from '../../../../infra/utils';
import { Toast } from '../../Toast';

export const ChannelManagement = () => {
  const dataProxy = useDataProxy();
  const { eventPubEmit } = useEventPub();
  const [list, setList] = useState([]);

  const onTitleClick = (e: any, link: string) => {
    openBrowser(link);
    e.preventDefault();
  };

  const syncChannel = (channelId: string) => {
    console.log(channelId);
    Toast.show({
      type: 'info',
      title: '开始同步',
    });
    eventPubEmit.MANUAL_SYNC_UNREAD_WITH_CHANNEL_ID({ channelId });
  };

  const columns = [
    {
      title: '频道名称',
      dataIndex: 'title',
      render: (text: string, row: ChannelEntity) => (
        <span
          className={styles.tableNameText}
          onClick={(e) => onTitleClick(e, row.link)}
          role="presentation"
        >
          <img src={row.favicon} alt="" className={styles.favicon} />
          <a href={row.link}>{text}</a>
        </span>
      ),
    },
    {
      title: 'RSS',
      dataIndex: 'feedUrl',
      render: (text: string) => <a href={text}>{text}</a>,
    },
    {
      title: '最后同步时间',
      dataIndex: 'lastSyncDate',
      render: (text: string) => {
        return <span>{Dayjs(text).format('YYYY-MM-DD HH:mm')}</span>;
      },
    },
    {
      title: '操作',
      dataIndex: 'feedUrl',
      render: (_text: any, row: ChannelEntity) => {
        return (
          <div>
            <Icon customClass={styles.tableIcon} name="edit" />
            <Icon
              customClass={styles.tableIcon}
              name="refresh"
              onClick={() => syncChannel(row.id)}
            />
            <Icon customClass={styles.tableIcon} name="delete" />
          </div>
        );
      },
    },
  ];

  const initial = () => {
    dataProxy
      .PROXY_GET_CHANNEL_LIST()
      .then((result) => {
        setList(result);
        console.log(result);
        return result;
      })
      .catch((err: any) => {
        console.log(err);
      });
  };

  useEffect(() => {
    initial();
  }, []);

  return (
    <Table
      size="small"
      columns={columns}
      dataSource={list}
      pagination={false}
    />
  );
};
