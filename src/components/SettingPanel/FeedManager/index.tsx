import React, { useEffect, useState } from "react";
import { Modal, Table, Input, Select } from "@douyinfe/semi-ui";
import { FolderIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Channel, Folder } from "../../../db";
import * as dataAgent from "../../../helpers/dataAgent";
import { busChannel } from "../../../helpers/busChannel";
import styles from "../setting.module.scss";

export const FeedManager = () => {
  const [list, setList] = useState<(Channel & { parent_uuid: String })[]>([]);
  const [renderList, setRenderList] = useState<(Channel & { parent_uuid: String })[]>([]);
  const [folderList, setFolderList] = useState<Folder[]>([]);
  const [filterParams, setFilterParams] = useState<{searchText?: string, folderUuid?: string}>({});
  const [searchText, setSearchText] = useState<string>("");
  const [folderUuid, setFolderUuid] = useState<string>("");

  const handleDeleteFeed = (channel: Channel) => {
    if (channel?.uuid) {
      Modal.confirm({
        title: "你确定要删除这个订阅吗？",
        content: channel.title,
        onOk: async () => {
          await dataAgent.deleteChannel(channel.uuid);
          busChannel.emit("getChannels");
          getList();
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
            <div>
              <a href={record.link} target={"_blank"} rel="noreferrer">
                {record.link}
              </a>
            </div>
          </div>
        );
      },
    },
    {
      title: "Feed url",
      dataIndex: "feed_url",
      render(text: string, record: Channel): JSX.Element {
        return (
          <div>
            <a href={text} target={"_blank"} rel="noreferrer">
              {text}
            </a>
          </div>
        );
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
    setFilterParams({
      ...filterParams,
      searchText: v,
    })
  };

  const handleFolderChange = (v: string) => {
    setFilterParams({
      ...filterParams,
      folderUuid: v,
    })
  }

  const getList = async (params = {}) => {
    const res = await dataAgent.getChannels(params) as { list: (Channel & { parent_uuid: String })[] };

    setList(res.list || []);
    console.log("%c Line:96 🍎 res.list", "color:#ffdd4d", res.list);
    setRenderList(res.list || []);
  };

  const getFolderList = async () => {
    const res = await dataAgent.getFolders();

    setFolderList(res || []);
  }

  useEffect(() => {
    const { searchText = '', folderUuid = '' } = filterParams;
    const result = list.filter((item) => {
      return (item.title.indexOf(searchText) > -1 || item.feed_url.indexOf(searchText) > -1) && (item.parent_uuid === folderUuid);
    });

    setRenderList(result);
  }, [filterParams]);

  useEffect(() => {
    getList();
    getFolderList();

    const unsubscribeGetChannels = busChannel.on("getChannels", () => {
      getList();
    });

    return () => {
      unsubscribeGetChannels();
    };
  }, []);

  return (
    <div className={styles.panel}>
      <h1 className={styles.panelTitle}>Feed Manager</h1>
      <div className={styles.panelBody}>
        <div className={styles.feedManagerFields}>
          <Input
            placeholder="Search Feed"
            showClear={true}
            value={filterParams.searchText}
            onChange={handleSearch}
          />
          <Select
            value={filterParams.folderUuid}
            showClear={true}
            placeholder="All Folder"
            onFocus={getFolderList}
            onChange={(v) => handleFolderChange(v as string)}
          >
            {folderList.map((folder) => {
              return <Select.Option value={folder.uuid}>{folder.name}</Select.Option>
            })}

          </Select>
        </div>
        <Table
          columns={columns}
          dataSource={renderList}
          pagination={false}
          size="small"
        />
      </div>
    </div>
  );
};
