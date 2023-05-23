import React, { ChangeEvent, useEffect, useState } from "react";
import { Modal, Table } from "@douyinfe/semi-ui";
import { DataTable } from "./DataTable";
import { Edit, Folder as FolderIcon, Trash2 } from "lucide-react";
import { Channel, Folder } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import styles from "../setting.module.scss";
import { CellContext, createColumnHelper } from "@tanstack/react-table";

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

  const columnHelper = createColumnHelper<Folder>();

  const columns = [
    {
      accessorKey: "name",
      header: "name",
      size: "auto",
      cell(props: CellContext<Folder, string>): JSX.Element {
        return (
          <div className="flex items-center">
            <FolderIcon size={16} className="mr-3" />
            <span>{props.row.original.name}</span>
          </div>
        );
      },
    },
    columnHelper.accessor((row) => `${row.uuid}-opt`, {
      id: "opt",
      header: "Action",
      size: 100,
      cell(props: CellContext<Folder, string>): JSX.Element {
        const record = props.row.original;

        return (
          <div className="grid grid-flow-col col-span-3">
            <span onClick={() => handleEditFolder(record)}>
              <Edit size={16} />
            </span>
            <span onClick={() => handleDeleteFolder(record)}>
              <Trash2 size={16} />
            </span>
          </div>
        );
      },
    }),
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
    <DataTable
      // @ts-ignore
      columns={columns}
      data={folderList}
    />
  );
};
