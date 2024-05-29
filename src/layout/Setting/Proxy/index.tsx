import { Button, IconButton, Switch } from "@radix-ui/themes";
import { Panel, PanelSection } from "../Panel";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import { ProxyModal } from "./ProxyModal";
import { useEffect, useMemo, useState } from "react";
import { request } from "@/helpers/request";
import { useModal } from "@/components/Modal/useModal";

export interface ProxyItemProps {
  proxy: LocalProxy;
  onEdit: () => void;
  onDelete: () => void;
  onRuleChange: () => void;
}

export const ProxyItem = ({ proxy, onEdit, onDelete, onRuleChange }: ProxyItemProps) => {
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
    </div>
  );
};

export const ProxySetting = () => {
  const [proxyModalStatus, setProxyModalStatus] = useModal();
  const [proxyRuleModalStatus, setProxyRuleModalStatus] = useModal();
  const [proxyList, setProxyList] = useState<LocalProxy[]>([]);
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
      return rules.filter((rule) => {
        return rule.indexOf(`${server}:${port}`) >= 0;
      }).map((r) => r.split(',')[1]);
    }

    return [];
  }, [rules, selectProxy]);

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

  return (
    <Panel title="Proxy Settings">
      <PanelSection title="Proxy" subTitle="use proxy server for connection">
        <Button variant="ghost" onClick={() => setProxyModalStatus(true)}>
          <PlusCircle size="16" strokeWidth={1.5} />
          Add Proxy
        </Button>
        <ProxyModal
          dialogStatus={proxyModalStatus}
          setDialogStatus={setProxyModalStatus}
          afterConfirm={getProxyList}
          proxy={selectProxy}
          filterSelectFeed={filterSelectFeed}
          afterCancel={() => {
            setSelectProxy(null);
          }}
        />
      </PanelSection>
      <div></div>
      <div>
        {proxyList.map((proxy) => {
          return (
            <ProxyItem
              proxy={proxy}
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
