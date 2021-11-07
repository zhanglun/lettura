/* eslint-disable react/display-name */
import React, { useState, useEffect } from 'react';
import { Table } from '@douyinfe/semi-ui';
import Dayjs from 'dayjs';
import { Icon } from '../../Icon';
import { useDataProxy } from '../../../hooks/useDataProxy';
import { ChannelEntity } from '../../../../entity/channel';
import styles from './index.module.css';

export const ChannelManagement = () => {
  const dataProxy = useDataProxy();
  const [list, setList] = useState([]);

  const columns = [
    {
      title: '频道名称',
      dataIndex: 'title',
      render: (text: string, row: ChannelEntity) => (
        <span className={styles.tableNameText}>
          <img src={row.favicon} alt="" className={styles.favicon}/>
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
      render: (_text: any, row) => {
        return (
          <div>
            <Icon customClass={styles.tableIcon} name="edit" />
            <Icon customClass={styles.tableIcon} name="refresh" />
            <Icon customClass={styles.tableIcon} name="delete" />
          </div>
        );
      },
    },
  ];

  const initial = () => {
    dataProxy
      .getChannelList()
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
      pagination={{ pageSize: list.length }}
    />
  );
};
