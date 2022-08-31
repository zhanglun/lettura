import React, { useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Table } from "@douyinfe/semi-ui"
import { Channel, db } from "../../../db";

export const FeedManager = () => {
  const channelList = useLiveQuery(() => db.channels.toArray(), []);

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
      render(text: string, record: Channel): JSX.Element {
        return <div></div>
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
