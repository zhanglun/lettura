import React, { useEffect, useState } from "react";

import { Folder as FolderIcon, Rss, Trash2 } from "lucide-react";
import { open } from "@tauri-apps/api/shell";
import { Channel, Folder } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import { DataTable } from "./DataTable";
import { CellContext, createColumnHelper } from "@tanstack/react-table";
import { getChannelFavicon } from "@/helpers/parseXML";
import { DialogUnsubscribeFeed } from "./DialogUnsubscribeFeed";
import { useModal } from "@/components/Modal/useModal";
import { Icon } from "@/components/Icon";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export const Feed = () => {
  const [list, setList] = useState<(Channel & { parent_uuid: String })[]>([]);
  const [showStatus, setModalStatus] = useModal();
  const [renderList, setRenderList] = useState<
    (Channel & { parent_uuid: String })[]
  >([]);
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
          <div>
            <div className="flex items-center">
              <img
                src={getChannelFavicon(link)}
                alt=""
                className="w-6 h-6 rounded-full mr-2"
              />
              <a
                className="font-bold hover:underline"
                href={link}
                target={"_blank"}
                rel="noreferrer"
              >
                {title}
              </a>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "folder",
      header: "Folder",
      size: "fix-content",
      cell(props: CellContext<Channel, string>): JSX.Element {
        return (
          <>
            {props.row.original.folder_name && (
              <div className="flex space-x-2 items-center">
                <FolderIcon size={16} />{" "}
                <span>{props.row.original.folder_name}</span>
              </div>
            )}
          </>
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
            {health_status === 0 && (
              <div className="w-3 h-3 rounded-full bg-green-600" />
            )}
            {health_status === 1 && (
              <HoverCard>
                <HoverCardTrigger>
                  <div className="w-3 h-3 rounded-full bg-red-600" />
                </HoverCardTrigger>
                <HoverCardContent>
                  <p>{failure_reason}</p>
                </HoverCardContent>
              </HoverCard>
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
      header: "Action",
      size: 110,
      cell(props: CellContext<Channel, string>): JSX.Element {
        return (
          <div className="flex space-x-1">
            <Icon
              className="w-6 h-6"
              onClick={() => open(props.row.original.feed_url)}
            >
              <Rss size={14} />
            </Icon>
            <Icon
              className="w-6 h-6"
              onClick={() => handleUnSubscribe(props.row.original)}
            >
              <Trash2 size={14} />
            </Icon>
          </div>
        );
      },
    }),
  ];

  const handleSearch = (v: string) => {
    setFilterParams({
      ...filterParams,
      searchText: v,
    });
  };

  const getList = async (params = {}) => {
    dataAgent.getChannels(params).then((res) => {
      setList(res.list || []);
      setRenderList(res.list || []);
    });
  };

  useEffect(() => {
    const { searchText = "", folderUuid = "" } = filterParams;
    const result = list.filter((item) => {
      return (
        (item.title.indexOf(searchText) > -1 ||
          item.feed_url.indexOf(searchText) > -1) &&
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
    <div className="pt-2">
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
