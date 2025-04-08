import { Badge, Button, Flex, IconButton, Switch } from "@radix-ui/themes";
import { Panel, PanelSection } from "../Panel";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import { ProxyModal } from "./ProxyModal";
import { useEffect, useMemo, useState } from "react";
import { request } from "@/helpers/request";
import { useModal } from "@/components/Modal/useModal";
import { useBearStore } from "@/stores";
import { FeedResItem } from "@/db";
import { useTranslation } from "react-i18next";

export interface ProxyItemProps {
  proxy: LocalProxy;
  bindFeeds: FeedResItem[];
  onEdit: () => void;
  onDelete: () => void;
  onRuleChange: () => void;
}

export const ProxyItem = ({ proxy, bindFeeds, onEdit, onDelete, onRuleChange }: ProxyItemProps) => {
  const [enable, setEnable] = useState(proxy.enable);

  function changeProxyStatus(checked: boolean) {
    request
      .post("proxy", {
        id: `socks5://${proxy.server}:${proxy.port}`,
        proxy: {
          ...proxy,
          enable: checked,
        },
      })
      .then((res) => {
        setEnable(checked);
      });
  }

  return (
    <div className=" p-4 border my-2 rounded hover:bg-[var(--gray-2)]">
      <div className="flex justify-between items-center">
        <div>
          socks5://{proxy.server}:{proxy.port}
        </div>
        <div className="flex items-center flex-row gap-3">
          <IconButton size="2" variant="ghost" color="gray" className="text-[var(--gray-12)]" onClick={() => onEdit()}>
            <Edit size="16" strokeWidth={1.5} />
          </IconButton>
          <IconButton
            size="2"
            variant="ghost"
            color="gray"
            className="text-[var(--gray-12)]"
            onClick={() => onDelete()}
          >
            <Trash2 size="16" strokeWidth={1.5} />
          </IconButton>
          <Switch checked={enable} onCheckedChange={(checked) => changeProxyStatus(checked)} />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap mt-3">
        {bindFeeds.map((feed) => {
          return <Badge>{feed.title}</Badge>;
        })}
      </div>
    </div>
  );
};

export const ProxySetting = () => {
  const { t } = useTranslation();
  const store = useBearStore((state) => ({
    subscribes: state.subscribes,
  }));
  const [proxyModalStatus, setProxyModalStatus] = useState<boolean>(false);
  const [proxyRuleModalStatus, setProxyRuleModalStatus] = useModal();
  const [proxyList, setProxyList] = useState<LocalProxy[]>([]);
  const [feedList, setFeedList] = useState<FeedResItem[]>([]);
  const [selectProxy, setSelectProxy] = useState<LocalProxy | null>(null);
  const [rules, setRules] = useState<string[]>([]);

  function getProxyList() {
    request.get("/proxy").then(({ data }) => {
      setProxyList(data.proxy || []);
      setRules(data.proxy_rules);
    });
  }

  function handleEditProxy(p: LocalProxy) {
    setProxyModalStatus(true);
    setSelectProxy(p);
  }

  function handleChangeRule(p: LocalProxy) {
    setProxyRuleModalStatus(true);
    setSelectProxy(p);
  }

  const filterSelectFeed = useMemo(() => {
    if (selectProxy) {
      const { server, port } = selectProxy;
      console.log("%c Line:87 🍡 rules", "color:#3f7cff", rules);
      return rules
        .filter((rule) => {
          return rule.indexOf(`${server}:${port}`) >= 0;
        })
        .map((r) => r.split(",")[1]);
    }

    return [];
  }, [rules, selectProxy]);

  function getSelectFeedResItem(proxy: LocalProxy, rules: string[]) {
    const { server, port } = proxy;
    const urls = rules
      .filter((rule) => {
        return rule.indexOf(`${server}:${port}`) >= 0;
      })
      .map((r) => r.split(",")[1]);

    return feedList.filter((l) => {
      return urls.find((f) => f === l.feed_url);
    });
  }

  function handleDeleteProxy(p: LocalProxy) {
    request
      .delete("/proxy", {
        data: {
          id: `socks5://${p.server}:${p.port}`,
          proxy: {
            ...p,
          },
        },
      })
      .then((res) => {
        getProxyList();
      });
  }

  useEffect(() => {
    getProxyList();
  }, []);

  useEffect(() => {
    setFeedList(
      store.subscribes.reduce((acu, cur) => {
        if (cur.item_type === "folder" && cur.children && cur.children.length > 0) {
          acu = acu.concat([...cur.children]);
        }

        if (cur.item_type === "channel") {
          acu.push(cur);
        }

        return acu;
      }, [] as FeedResItem[])
    );
  }, [store.subscribes]);

  return (
    <Panel title={t("Proxy Settings")}>
      <PanelSection title={t("Proxy")} subTitle={t("you can try to use proxy server for connection when feed cant access")}>
        <Button variant="ghost" onClick={() => setProxyModalStatus(true)}>
          <PlusCircle size="16" strokeWidth={1.5} />
          {t("Add Proxy")}
        </Button>
        <ProxyModal
          dialogStatus={proxyModalStatus}
          setDialogStatus={setProxyModalStatus}
          afterConfirm={getProxyList}
          proxy={selectProxy}
          feedList={feedList}
          filterSelectFeed={filterSelectFeed}
          afterCancel={() => {
            setSelectProxy(null);
          }}
        />
      </PanelSection>
      <div></div>
      <div>
        {proxyList.map((proxy, idx) => {
          return (
            <ProxyItem
              key={idx}
              proxy={proxy}
              bindFeeds={getSelectFeedResItem(proxy, rules)}
              onEdit={() => handleEditProxy(proxy)}
              onDelete={() => handleDeleteProxy(proxy)}
              onRuleChange={() => handleChangeRule(proxy)}
            />
          );
        })}
      </div>
    </Panel>
  );
};
