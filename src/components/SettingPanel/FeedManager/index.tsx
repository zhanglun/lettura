import React, { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Modal, Table } from "@douyinfe/semi-ui"
import { Channel, db } from "../../../db";
import * as dataAgent from '../../../helpers/dataAgent';

export const FeedManager = () => {
  const channelList = useLiveQuery(() => db.channels.toArray(), []);

  const handleDeleteFeed = (feed: Channel) => {
    if (feed && feed.id) {
      Modal.confirm({
        title: '你确定要删除这个订阅吗？',
        content: feed.title,
        onOk: () => {
          feed.id && dataAgent.deleteChannel(feed.id)
        },
      })
    }
  }

  const columns = [
    {
      title: 'name',
      dataIndex: 'title',
      render(text: string, record: Channel) {
        return <div>
          <div>{text}</div>
          <div>{record.link}</div>
        </div>
      }
    },
    {
      title: 'Feed url',
      dataIndex: 'feedUrl',
      render(text: string, record: Channel): JSX.Element {
        return <div>{text}</div>
      }
    },
    {
      title: 'Action',
      dataIndex: 'opt',
      width: 100,
      render(text: string, record: Channel): JSX.Element {
        return <div>
          <span onClick={() => handleDeleteFeed(record)}>删除</span>
        </div>
      }
    }
  ];

  useEffect(() => {
    console.log(channelList);
  }, [channelList]);

  return <div>
    <div>
      <Table
        columns={columns}
        dataSource={channelList}
        pagination={false}
        size="small"
      />
    </div>
  </div>;
};
