import React, { useEffect, useState } from "react";
import { DataTable } from "./DataTable";
import { Edit, Folder as FolderIcon, Trash2 } from "lucide-react";
import { FeedResItem, FolderResItem } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { useModal } from "@/components/Modal/useModal";
import { CellContext, createColumnHelper } from "@tanstack/react-table";
import { DialogDeleteFolder } from "./DialogDeleteFolder";
import { IconButton } from "@radix-ui/themes";
import { AddFolder } from "@/components/AddFolder";

export const FolderList = () => {
  const [folderList, setFolderList] = useState<FolderResItem[]>([]);
  const [showStatus, setModalStatus] = useModal();
  const [editStatus, setEditStatus] = useModal();
  const [currentFolder, setCurrentFolder] = useState<FolderResItem | null>(null);

  const handleEditFolder = (folder: FolderResItem) => {
    if (folder?.uuid) {
      setCurrentFolder(folder);
      setEditStatus(true);
    }
  };

  const handleDeleteFolder = (folder: FolderResItem) => {
    if (folder?.uuid) {
      setCurrentFolder(folder);
      setModalStatus(true);
    }
  };

  const columnHelper = createColumnHelper<FolderResItem>();
  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      size: "auto",
      cell(props: CellContext<FolderResItem, string>): JSX.Element {
        return (
          <div className="flex items-center">
            <FolderIcon size={16} className="mr-3" />
            <span>{props.row.original.title}</span>
          </div>
        );
      },
    },
    columnHelper.accessor((row) => `${row.uuid}-opt`, {
      id: "opt",
      header: "",
      size: 100,
      cell(props: CellContext<FolderResItem, string>): JSX.Element {
        const record = props.row.original;

        return (
          <div className="flex space-x-1">
            <IconButton variant="ghost" color="gray" onClick={() => handleEditFolder(record)}>
              <Edit size={14} />
            </IconButton>
            <IconButton variant="ghost" color="red" onClick={() => handleDeleteFolder(record)}>
              <Trash2 size={14} />
            </IconButton>
          </div>
        );
      },
    }),
  ];

  const getFolderList = () => {
    dataAgent.getFolders().then(({ data }) => {
      setFolderList(data || []);
    });
  };

  useEffect(() => {
    console.log("folder effect");
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
        folder={currentFolder}
        afterConfirm={getFolderList}
        afterCancel={() => {}}
      />
      <AddFolder
        action="edit"
        dialogStatus={editStatus}
        setDialogStatus={setEditStatus}
        folder={currentFolder}
        afterConfirm={getFolderList}
        afterCancel={() => {}}
      />
    </div>
  );
};
