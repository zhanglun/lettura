import { request } from "@/helpers/request";
import { Avatar, Badge, Button, Dialog, Flex, TextField } from "@radix-ui/themes";
import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AddProxyRuleModal } from "./AddProxyRuleModal";
import { FeedResItem } from "@/db";
import { CrossCircledIcon } from "@radix-ui/react-icons";
import { getFeedLogo } from "@/helpers/parseXML";
import * as dataAgent from "@/helpers/dataAgent";
import { CrossIcon, X } from "lucide-react";

export interface ProxyModalProps {
  proxy?: LocalProxy | null;
  feedList: FeedResItem[];
  filterSelectFeed: string[];
  dialogStatus: boolean;
  trigger?: React.ReactNode;
  setDialogStatus: (status: boolean) => void;
  afterConfirm: () => void;
  afterCancel: () => void;
}

export const ProxyModal =
  /**
   *
   */
  (props: ProxyModalProps) => {
    const { proxy, filterSelectFeed, feedList, dialogStatus, setDialogStatus, afterConfirm, afterCancel, trigger } =
      props;
    console.log("%c Line:28 🌮 feedList", "color:#e41a6a", feedList);
    const [title, setTitle] = useState("");
    const [disabled, setDisabled] = useState(true);
    const [server, setServer] = useState("");
    const [port, setPort] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [selectFeeds, setSelectFeeds] = useState<FeedResItem[]>([]);

    const reset = () => {
      setDisabled(true);
      setServer("");
      setPort("");
      setUsername("");
      setPassword("");
      setSelectFeeds([]);
    };

    const handleCancel = () => {
      reset();
      afterCancel();
    };

    const handleOpenChange = (status: boolean) => {
      setDialogStatus(status);

      if (!status) {
        reset();
        afterCancel();
      }
    };

    const handleRemoveFeed = (feed: FeedResItem) => {
      const idx = selectFeeds.findIndex((f) => f.feed_url === feed.feed_url);

      if (idx >= 0) {
        setSelectFeeds([...selectFeeds.slice(0, idx), ...selectFeeds.slice(idx + 1)]);
      }
    };

    const handleSave = () => {
      const params = {
        server,
        port,
        username,
        password,
      };

      let fn = proxy
        ? request.post("proxy", {
            id: `socks5://${proxy.server}:${proxy.port}`,
            proxy: {
              ...params,
              enable: proxy.enable,
            },
            rules: selectFeeds.map((s) => s.feed_url),
          })
        : request.put("proxy", {
            proxy: {
              ...params,
              enable: false,
            },
            rules: selectFeeds.map((s) => s.feed_url),
          });

      fn.then(({ data }) => {
        console.log(data);
        if (data.error) {
          toast.error(data.error);
        } else {
          setDialogStatus(false);
          reset();
          afterConfirm();
        }
      });
    };

    useEffect(() => {
      setDisabled(!(server && port));
    }, [server, port]);

    useEffect(() => {
      setTitle(proxy ? "Edit proxy" : "Add proxy");

      setServer(proxy?.server || "");
      setPort(proxy?.port || "");
      setUsername(proxy?.username || "");
      setPassword(proxy?.password || "");
    }, [proxy]);

    useEffect(() => {
      setSelectFeeds(
        feedList.filter((l) => {
          return filterSelectFeed.find((f) => f === l.feed_url);
        })
      );
      console.log("%c Line:123 🥑 filterSelectFeed", "color:#42b983", filterSelectFeed);
    }, [filterSelectFeed]);

    return (
      <Dialog.Root open={dialogStatus} onOpenChange={handleOpenChange}>
        <Dialog.Content className="sm:max-w-[540px]">
          <Dialog.Title className="lex items-center" size="6" mt="2" mb="1">
            {title}
          </Dialog.Title>
          <Dialog.Description size="2" mb="4" color="gray">
            {}
          </Dialog.Description>
          <div>
            <div className="mb-1 text-[var(--gray-11)]">Connection</div>
            <div className="grid grid-cols-[3fr_1fr] gap-2">
              <TextField.Root
                placeholder="Server"
                mb="2"
                value={server}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setServer(e.target.value)}
              ></TextField.Root>
              <TextField.Root
                placeholder="Port"
                mb="2"
                value={port}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPort(e.target.value)}
              ></TextField.Root>
            </div>
            <div className="mb-1 mt-3 text-[var(--gray-11)]">Credentials(optional)</div>
            <div className="grid grid-cols-2 gap-2">
              <TextField.Root
                placeholder="Username"
                mb="2"
                value={username}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              ></TextField.Root>
              <TextField.Root
                placeholder="Password"
                mb="2"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              ></TextField.Root>
            </div>
            <div>
              <div className="mb-1 mt-3 text-[var(--gray-11)]">Subscribes using proxy</div>
              <div className="mt-3">
                <AddProxyRuleModal feedList={feedList} value={selectFeeds} onValueChange={(v) => setSelectFeeds(v)} />
                {/* <div className="grid grid-cols-3 auto-rows-fr mt-3"> */}
                <div className="flex gap-2 flex-wrap mt-3">
                  {selectFeeds.map((feed) => {
                    return (
                      // <div className="m-[2px] flex gap-2 items-center p-2 pr-1 hover:bg-[var(--gray-2)] rounded group">
                      //   <span className="flex-1 text-xs select-none line-clamp-2 font-medium">{feed.title}</span>
                      //   <X
                      //     size={20}
                      //     strokeWidth={1.5}
                      //     className="invisible group-hover:visible text-[var(--gray-8)] hover:text-[var(--gray-12)] cursor-pointer"
                      //     onClick={() => handleRemoveFeed(feed)}
                      //   />
                      // </div>
                      <Badge className="group relative">
                        {feed.title}
                        <CrossCircledIcon
                          className="invisible group-hover:visible text-[var(--gray-8)] hover:text-[var(--gray-11)] cursor-pointer absolute -right-1 -top-1"
                          onClick={() => handleRemoveFeed(feed)}
                        />
                      </Badge>
                    );
                  })}
                </div>
                {/* </div> */}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Dialog.Close>
                <Button variant="soft" onClick={handleCancel}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button onClick={handleSave} disabled={disabled}>
                Save
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    );
  };
