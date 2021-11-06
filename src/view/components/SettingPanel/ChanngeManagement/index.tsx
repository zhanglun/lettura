/* eslint-disable react/display-name */
import React, { useState, useEffect } from 'react';
import { Table } from '@douyinfe/semi-ui';
import { useDataProxy } from '../../../hooks/useDataProxy';

export const ChannelManagement = () => {
  const dataProxy = useDataProxy();
  const [list, setList] = useState([]);

  const columns = [
    {
      title: '频道名称',
      dataIndex: 'title',
      render: (text: string) => <span>{text}</span>,
    },
    {
      title: '简介',
      dataIndex: 'description',
    },
    {
      title: '首页',
      dataIndex: 'link',
    },
    {
      title: 'RSS',
      dataIndex: 'feedUrl',
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
