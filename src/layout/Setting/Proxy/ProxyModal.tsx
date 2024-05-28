import { request } from "@/helpers/request";
import { Avatar, Button, Dialog, TextField } from "@radix-ui/themes";
import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AddProxyRuleModal } from "./AddProxyRuleModal";
import { FeedResItem } from "@/db";
import { getChannelFavicon } from "@/helpers/parseXML";
import * as dataAgent from "@/helpers/dataAgent";

export interface ProxyModalProps {
  proxy?: LocalProxy | null;
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
    const { proxy, filterSelectFeed, dialogStatus, setDialogStatus, afterConfirm, afterCancel, trigger } = props;
    console.log("%c Line:26 🥐 rules", "color:#2eafb0", filterSelectFeed);
    const [title, setTitle] = useState("");
    const [disabled, setDisabled] = useState(true);
    const [server, setServer] = useState("");
    const [port, setPort] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [list, setList] = useState<FeedResItem[]>([]);
    const [selectFeeds, setSelectFeeds] = useState<FeedResItem[]>([]);

    const reset = () => {
      setDisabled(true);
      setServer("");
      setPort("");
      setUsername("");
      setPassword("");
    };

    const handleCancel = () => {
      reset();
      afterCancel();
    };

    const handleSave = () => {
      const params = {
        server,
        port,
        username,
        password,
      };

      console.log("%c Line:15 🍅 params", "color:#ea7e5c", params);

      let fn = proxy
        ? request.post("proxy", {
            id: `socks5://${proxy.server}:${proxy.port}`,
            proxy: {
              ...params,
              enable: proxy.enable,
            },
            rules: selectFeeds.map((s) => s.link),
          })
        : request.put("proxy", {
            proxy: {
              ...params,
              enable: false,
            },
            rules: selectFeeds.map((s) => s.link),
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
        list.filter((l) => {
          return filterSelectFeed.find((f) => f === l.link);
        })
      );
    }, [filterSelectFeed]);

    function getFeeds() {
      dataAgent.getChannels({}).then(({ data }) => {
        console.log("%c Line:157 🍢 data", "color:#3f7cff", data);
        setList(data.list || []);
      });
    }

    useEffect(() => {
      getFeeds();
    }, []);

    return (
      <Dialog.Root open={dialogStatus} onOpenChange={setDialogStatus}>
        <Dialog.Content className="sm:max-w-[510px]">
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
              <div className="mb-1 mt-3 text-[var(--gray-11)]">Subscribes</div>
              <div>
                <AddProxyRuleModal feedList={list} value={selectFeeds} onValueChange={(v) => setSelectFeeds(v)} />
                <div>
                  {selectFeeds.map((feed) => {
                    return (
                      <div className="flex gap-2 items-start p-1">
                        <Avatar
                          src={getChannelFavicon(feed.link)}
                          fallback={feed.title.slice(0, 1)}
                          alt={feed.title}
                          size="1"
                        />
                        <span className="text-sm">{feed.title}</span>
                      </div>
                    );
                  })}
                </div>
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
