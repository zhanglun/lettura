import React, { ChangeEvent, useEffect, useState } from "react";
import { Table } from "@douyinfe/semi-ui";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { Channel, Folder } from "@/db";
import * as dataAgent from "@/helpers/dataAgent";
import { busChannel } from "@/helpers/busChannel";
import styles from "../setting.module.scss";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export const Feed = () => {
  const [list, setList] = useState<(Channel & { parent_uuid: String })[]>([]);
  const [renderList, setRenderList] = useState<
    (Channel & { parent_uuid: String })[]
  >([]);
  const [folderList, setFolderList] = useState<Folder[]>([]);
  const [filterParams, setFilterParams] = useState<{
    searchText?: string;
    folderUuid?: string;
  }>({});
  const okText = "Sounds great!";
  const cancelText = "No, thanks.";

  const { toast } = useToast();

  const [currentFeed, setCurrentFeed] = useState<Channel | null>(null);
  const [unsubscribeDialogStatus, setUnsubscribeDialogStatus] = useState(false);

  const handleUnSubscribe = (channel: Channel) => {
    if (channel?.uuid) {
      setCurrentFeed(channel);
      setUnsubscribeDialogStatus(true);
    }
  };

  const confirmUnsubscribe = () => {
    if (currentFeed?.uuid) {
      dataAgent
        .deleteChannel(currentFeed.uuid)
        .then(() => {
          busChannel.emit("getChannels");
          getList();
          setUnsubscribeDialogStatus(false);
        })
        .catch((err) => {
          toast({
            variant: "destructive",
            title: "Ops! Something wrong~",
            description: err.message,
            duration: 2,
          });
        });
    }
  };

  const handleEditFolder = (folder: Folder) => {
    if (folder?.uuid) {
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
              className={styles.actionBtn}
              onClick={() => handleUnSubscribe(record)}
            >
              <Trash2 size={16} />
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
    });
  };

  const handleFolderChange = (v: string) => {
    setFilterParams({
      ...filterParams,
      folderUuid: v,
    });
  };

  const getList = async (params = {}) => {
    dataAgent.getChannels(params).then((res) => {
      console.log("%c Line:173 🍬 res", "color:#ea7e5c", res);
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
    <div>
      <div className="grid grid-flow-col grid-cols-[260px_140px] gap-3 pt-2 pb-4">
        <Input
          className="h-8"
          placeholder="Search Feed"
          value={filterParams.searchText}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleSearch(e.target.value)
          }
        />
        <Select
          value={filterParams.folderUuid}
          onValueChange={(v: string) => handleFolderChange(v)}
        >
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="All Folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem key=" " value="">
                All Folder
              </SelectItem>
              {folderList.map((folder) => {
                return (
                  <SelectItem key={folder.uuid} value={folder.uuid}>
                    {folder.name}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <Table
        columns={columns}
        dataSource={renderList}
        pagination={false}
        size="small"
      />
      <AlertDialog
        open={unsubscribeDialogStatus}
        onOpenChange={setUnsubscribeDialogStatus}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              data relates with
              <span className="text-primary font-bold ml-1">
                {currentFeed?.title}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              className="text-destructive-foreground bg-destructive hover:bg-[hsl(var(--destructive)/0.9)]"
              onClick={() => confirmUnsubscribe()}
            >
              Unsubscribe
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
