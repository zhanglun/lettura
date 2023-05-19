import React, { ChangeEvent, useEffect, useState } from "react";
import { Modal, Table } from "@douyinfe/semi-ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Folder as FolderIcon, Trash2 } from "lucide-react";
import { Channel, Folder } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import styles from "../setting.module.scss";

export const FolderList = () => {
  const [folderList, setFolderList] = useState<Folder[]>([]);
  const okText = "Sounds great!";
  const cancelText = "No, thanks.";

  const handleEditFolder = (folder: Folder) => {
    if (folder?.uuid) {
    }
  };

  const handleDeleteFolder = (folder: Folder) => {
    if (folder?.uuid) {
      Modal.confirm({
        title: "Are you sure you want to delete this folder?？",
        content: folder.name,
        okText,
        cancelText,
        onOk: async () => {
          await dataAgent.deleteFolder(folder.uuid);
          await getFolderList();
          busChannel.emit("getChannels");
        },
      });
    }
  };

  const folderColumns = [
    {
      title: "name",
      dataIndex: "name",
      render(text: string, record: Channel) {
        return (
          <div className={styles.nameCol}>
            <FolderIcon size={16} />
            <span>{text}</span>
          </div>
        );
      },
    },
    {
      title: "Action",
      dataIndex: "opt",
      width: 100,
      render(text: string, record: Folder): JSX.Element {
        return (
          <div className={styles.actionCol}>
            <span
              className={styles.actionBtn}
              onClick={() => handleEditFolder(record)}
            >
              <Edit size={16} />
            </span>
            <span
              className={styles.actionBtn}
              onClick={() => handleDeleteFolder(record)}
            >
              <Trash2 size={16} />
            </span>
          </div>
        );
      },
    },
  ];

  const getFolderList = () => {
    dataAgent.getFolders().then((res) => {
      setFolderList(res || []);
    });
  };

  useEffect(() => {
    getFolderList();
  }, []);

  return (
    <Table
      // @ts-ignore
      columns={folderColumns}
      dataSource={folderList}
      pagination={false}
      size="small"
    />
  );
};
