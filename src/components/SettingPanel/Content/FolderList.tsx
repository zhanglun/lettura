import React, { ChangeEvent, useEffect, useState } from "react";
import { Modal  } from "@douyinfe/semi-ui";
import { DataTable } from "./DataTable";
import { Edit, Folder as FolderIcon, Trash2 } from "lucide-react";
import { Channel, Folder } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import styles from "../setting.module.scss";
import { CellContext, createColumnHelper } from "@tanstack/react-table";
import { Icon } from "@/components/Icon";

export const FolderList = () => {
  const [ folderList, setFolderList ] = useState<Folder[]>([]);
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
            <FolderIcon size={ 16 } className="mr-3"/>
            <span>{ props.row.original.name }</span>
          </div>
        );
      },
    },
    columnHelper.accessor((row) => `${ row.uuid }-opt`, {
      id: "opt",
      header: "Action",
      size: 100,
      cell(props: CellContext<Folder, string>): JSX.Element {
        const record = props.row.original;

        return (
          <div className="flex space-x-1">
            <Icon className="w-6 h-6" onClick={ () => handleEditFolder(record) }>
              <Edit size={ 14 }/>
            </Icon>
            <Icon className="w-6 h-6" onClick={ () => handleDeleteFolder(record) }>
              <Trash2 size={ 14 }/>
            </Icon>
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
      columns={ columns }
      data={ folderList }
    />
  );
};
