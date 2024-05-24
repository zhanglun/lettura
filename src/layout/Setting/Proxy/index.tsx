import { Button, IconButton, Switch } from "@radix-ui/themes";
import { Panel, PanelSection } from "../Panel";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import { ProxyModal } from "./ProxyModal";
import { useEffect, useState } from "react";
import { request } from "@/helpers/request";
import { useModal } from "@/components/Modal/useModal";

export interface ProxyItemProps {
  proxy: LocalProxy;
  onEdit: () => void;
  onDelete: () => void;
}

export const ProxyItem = ({ proxy, onEdit, onDelete }: ProxyItemProps) => {
  const [enable, setEnable] = useState(proxy.enable);

  function changeProxyStatus(checked: boolean) {
    request
      .post("proxy", {
        id: `socks5://${proxy.server}:${proxy.port}`,
        data: {
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
      <div className="mt-3">
        <IconButton size="2" variant="ghost" color="gray">
          Add subscribe
        </IconButton>
      </div>
    </div>
  );
};

export const ProxySetting = () => {
  const [proxyModalStatus, setProxyModalStatus] = useModal();
  const [proxyList, setProxyList] = useState<LocalProxy[]>([]);
  const [selectProxy, setSelectProxy] = useState<LocalProxy | null>(null);

  function getProxyList() {
    request.get("/proxy").then(({ data }) => {
      setProxyList(data.proxy || []);
      console.log("%c Line:14 🍕 data", "color:#ed9ec7", data);
    });
  }

  function handleEditProxy(p: LocalProxy) {
    setProxyModalStatus(true);
    setSelectProxy(p);
  }

  function handleDeleteProxy(p: LocalProxy) {
    request
      .delete("/proxy", {
        data: {
          id: `socks5://${p.server}:${p.port}`,
          data: {
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
      <PanelSection title="Proxy" subTitle="">
        <Button variant="ghost" onClick={() => setProxyModalStatus(true)}>
          <PlusCircle size="16" strokeWidth={1.5} />
          Add Proxy
        </Button>
        <ProxyModal
          dialogStatus={proxyModalStatus}
          setDialogStatus={setProxyModalStatus}
          afterConfirm={getProxyList}
          proxy={selectProxy}
          afterCancel={() => {
            setSelectProxy(null);
          }}
        />
      </PanelSection>
      <div></div>
      <div>
        {proxyList.map((proxy) => {
          return (
            <ProxyItem proxy={proxy} onEdit={() => handleEditProxy(proxy)} onDelete={() => handleDeleteProxy(proxy)} />
          );
        })}
      </div>
    </Panel>
  );
};
