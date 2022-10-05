import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Modal, Table, Input, Button } from "@douyinfe/semi-ui";
import { Channel, db } from "../../../db";
import * as dataAgent from "../../../helpers/dataAgent";
import styles from "./feedManage.module.scss";
import { TrashIcon } from "@heroicons/react/24/outline";

export const FeedManager = () => {
  const channelList = useLiveQuery(() => db.channels.toArray(), []);
  const [list, setList] = useState<Channel[]>([]);
  const [searchText, setSearchText] = useState<string>("");

  const handleDeleteFeed = (feed: Channel) => {
    if (feed && feed.id) {
      Modal.confirm({
        title: "你确定要删除这个订阅吗？",
        content: feed.title,
        onOk: () => {
          feed.id && dataAgent.deleteChannel(feed.id);
        },
      });
    }
  };

  const columns = [
    {
      title: "name",
      dataIndex: "title",
      render(text: string, record: Channel) {
        return (
          <div>
            <div>{text}</div>
            <div>{record.link}</div>
          </div>
        );
      },
    },
    {
      title: "Feed url",
      dataIndex: "feedUrl",
      render(text: string, record: Channel): JSX.Element {
        return <div>{text}</div>;
      },
    },
    {
      title: "Action",
      dataIndex: "opt",
      width: 100,
      render(text: string, record: Channel): JSX.Element {
        return (
          <div>
            <span
              className={styles.delBtn}
              onClick={() => handleDeleteFeed(record)}
            >
              <TrashIcon className={"h4 w-4"} />
            </span>
          </div>
        );
      },
    },
  ];

  const handleSearch = (v: string) => {
    setSearchText(v);
    dataAgent.queryChannelWithKeywords(v).then((res) => {
      console.log("🚀 ~ file: index.tsx ~ line 67 ~ dataAgent.queryChannelWithKeywords ~ res", res)
      setList(res);
    })
  };

  useEffect(() => {
    setList(channelList as [])
  }, [channelList]);

  return (
    <div>
      <div>
        <div>
          <Input
            placeholder="Search Feed"
            showClear
            value={searchText}
            onChange={handleSearch}
          />
        </div>
        <Table
          columns={columns}
          dataSource={list}
          pagination={false}
          size="small"
        />
      </div>
    </div>
  );
};
