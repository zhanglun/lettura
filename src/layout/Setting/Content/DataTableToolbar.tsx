"use client";

import { X, Frown, Laugh, FolderIcon } from "lucide-react";
import { Table } from "@tanstack/react-table";
import * as dataAgent from "@/helpers/dataAgent";
import { DataTableFacetedFilter } from "./DataTableFacetedFilter";
import { useEffect, useState } from "react";
import { FolderResItem } from "@/db";
import { TextField, Button } from "@radix-ui/themes";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

const statuses = [
  {
    value: 0,
    label: "Good",
    icon: Laugh,
  },
  {
    value: 1,
    label: "Bad",
    icon: Frown,
  },
];

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;
  const [folderList, setFolderList] = useState<FolderResItem[]>([]);

  const getFolderList = () => {
    dataAgent.getFolders().then(({ data }) => {
      setFolderList(data || []);
    });
  };

  useEffect(() => {
    getFolderList();
  }, []);

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <TextField.Root
          placeholder="Filter feeds..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="w-[150px] lg:w-[250px]"
        />
        {/* {table.getColumn("folder") && folderList.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn("health_status")}
            title="Folder"
            options={folderList.map((folder) => {
              return {
                value: folder.name,
                label: folder.name,
                icon: FolderIcon,
              };
            })}
          />
        )} */}
        {table.getColumn("health_status") && (
          <DataTableFacetedFilter
            column={table.getColumn("health_status")}
            title="Status"
            // @ts-ignore
            options={statuses}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="px-2 lg:px-3"
          >
            Reset
            <X className="ml-2" size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
