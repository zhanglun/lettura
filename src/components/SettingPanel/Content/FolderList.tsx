import React, { useEffect, useState } from "react";
import { DataTable } from "./DataTable";
import { Edit, Folder as FolderIcon, Trash2 } from "lucide-react";
import {FeedResItem, Folder} from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { useModal } from "@/components/Modal/useModal";
import { CellContext, createColumnHelper } from "@tanstack/react-table";
import { Icon } from "@/components/Icon";
import { DialogDeleteFolder } from "./DialogDeleteFolder";

export const FolderList = () => {
  const [folderList, setFolderList] = useState<Folder[]>([]);
  const [showStatus, setModalStatus] = useModal();
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);

  const handleEditFolder = (folder: Folder) => {
    if (folder?.uuid) {
    }
  };

  const handleDeleteFolder = (folder: Folder) => {
    if (folder?.uuid) {
      setCurrentFolder(folder);
      setModalStatus(true);
    }
  };

  const columnHelper = createColumnHelper<Folder>();
  const columns = [
    {
      accessorKey: "name",
      header: "Name",
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
          <div className="flex space-x-1">
            <Icon className="w-6 h-6" onClick={() => handleEditFolder(record)}>
              <Edit size={14} />
            </Icon>
            <Icon
              className="w-6 h-6"
              onClick={() => handleDeleteFolder(record)}
            >
              <Trash2 size={14} />
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
    <div>
      <DataTable
        // @ts-ignore
        columns={columns}
        data={folderList}
      />
      <DialogDeleteFolder
        dialogStatus={showStatus}
        setDialogStatus={setModalStatus}
        folder={currentFolder as Folder & FeedResItem}
        afterConfirm={getFolderList}
        afterCancel={() => {}}
      />
    </div>
  );
};
