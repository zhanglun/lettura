import React, { useEffect, useState } from "react";

import { Folder as FolderIcon, Rss, Trash2 } from "lucide-react";
import { open } from "@tauri-apps/api/shell";
import { Channel } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { DataTable } from "./DataTable";
import { CellContext, createColumnHelper } from "@tanstack/react-table";
import { getChannelFavicon } from "@/helpers/parseXML";
import { DialogUnsubscribeFeed } from "./DialogUnsubscribeFeed";
import { useModal } from "@/components/Modal/useModal";
import { Avatar, Badge, HoverCard, IconButton } from "@radix-ui/themes";

export const Feed = () => {
  const [list, setList] = useState<(Channel & { parent_uuid: String })[]>([]);
  const [showStatus, setModalStatus] = useModal();
  const [renderList, setRenderList] = useState<(Channel & { parent_uuid: String })[]>([]);
  const [filterParams, setFilterParams] = useState<{
    searchText?: string;
    folderUuid?: string;
  }>({});

  const [currentFeed, setCurrentFeed] = useState<Channel | null>(null);
  const handleUnSubscribe = (channel: Channel) => {
    if (channel?.uuid) {
      setCurrentFeed(channel);
      setModalStatus(true);
    }
  };
  const columnHelper = createColumnHelper<Channel>();
  const columns = [
    {
      accessorKey: "title",
      header: "Title",
      size: "fix-content",
      cell(props: CellContext<Channel, string>): JSX.Element {
        const { title, link } = props.row.original;

        return (
          <div className="flex items-center gap-2">
            <Avatar src={getChannelFavicon(link)} fallback={title.slice(0, 1)} alt={title} size="1" />
            <a className="font-bold hover:underline" href={link} target={"_blank"} rel="noreferrer">
              {title}
            </a>
            {props.row.original.folder_name && <Badge>{props.row.original.folder_name}</Badge>}
          </div>
        );
      },
    },
    {
      accessorKey: "health_status",
      header: "Health Status",
      cell(props: CellContext<Channel, string>): JSX.Element {
        const { health_status, failure_reason } = props.row.original;

        return (
          <div className="flex justify-center">
            {health_status === 0 && <div className="w-3 h-3 rounded-full bg-green-600" />}
            {health_status === 1 && (
              <HoverCard.Root>
                <HoverCard.Trigger>
                  <div className="w-3 h-3 rounded-full bg-red-600" />
                </HoverCard.Trigger>
                <HoverCard.Content>
                  <p>{failure_reason}</p>
                </HoverCard.Content>
              </HoverCard.Root>
            )}
          </div>
        );
      },
      filterFn: (row: any, id: string, value: number[]) => {
        return value.includes(row.getValue(id));
      },
    },
    columnHelper.accessor((row) => "last-sync-date", {
      id: "last_sync_date",
      header: "Last sync date",
      size: 160,
      cell(props: CellContext<Channel, string>): JSX.Element {
        const { last_sync_date = "" } = props.row.original;

        return <div className="flex justify-center">{last_sync_date}</div>;
      },
    }),
    columnHelper.accessor((row) => `${row.uuid}-opt`, {
      id: "opt",
      header: "",
      size: 110,
      cell(props: CellContext<Channel, string>): JSX.Element {
        return (
          <div className="flex space-x-1">
            <IconButton variant="ghost" color="gray" onClick={() => open(props.row.original.feed_url)}>
              <Rss size={14} />
            </IconButton>
            <IconButton variant="ghost" color="red" onClick={() => handleUnSubscribe(props.row.original)}>
              <Trash2 size={14} />
            </IconButton>
          </div>
        );
      },
    }),
  ];

  const getList = async (params = {}) => {
    dataAgent.getChannels(params).then(({ data }) => {
      console.log("%c Line:157 🍢 data", "color:#3f7cff", data);
      setList(data.list || []);
      setRenderList(data.list || []);
    });
  };

  useEffect(() => {
    const { searchText = "", folderUuid = "" } = filterParams;
    const result = list.filter((item) => {
      return (
        (item.title.indexOf(searchText) > -1 || item.feed_url.indexOf(searchText) > -1) &&
        item.parent_uuid === folderUuid
      );
    });

    setRenderList(result);
  }, [filterParams]);

  useEffect(() => {
    getList();

    const unsubscribeGetChannels = busChannel.on("getChannels", () => {
      getList();
    });

    return () => {
      unsubscribeGetChannels();
    };
  }, []);

  return (
    <div className="">
      <DataTable
        // @ts-ignore
        columns={columns}
        data={renderList}
      />
      <DialogUnsubscribeFeed
        dialogStatus={showStatus}
        setDialogStatus={setModalStatus}
        feed={currentFeed}
        afterConfirm={getList}
        afterCancel={() => {}}
      />
    </div>
  );
};
