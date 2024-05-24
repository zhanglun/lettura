import { Button, IconButton, Switch } from "@radix-ui/themes";
import { Panel, PanelSection } from "../Panel";
import { Edit, Trash2 } from "lucide-react";
import { ProxyModal } from "./ProxyModal";
import { useEffect, useState } from "react";
import { request } from "@/helpers/request";
import { useModal } from "@/components/Modal/useModal";

export interface ProxyItemProps {
  proxy: LocalProxy;
}

export const ProxyItem = ({ proxy }: ProxyItemProps) => {
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
          <IconButton size="2" variant="ghost" color="gray" className="text-[var(--gray-12)]">
            <Edit size="16" strokeWidth={1.5} />
          </IconButton>
          <IconButton size="2" variant="ghost" color="gray" className="text-[var(--gray-12)]">
            <Trash2 size="16" strokeWidth={1.5} />
          </IconButton>
          <Switch checked={enable} onCheckedChange={(checked) => changeProxyStatus(checked)} />
        </div>
      </div>
      <div className="mt-3">
        <IconButton variant="ghost" color="gray">Add subscribe</IconButton>
      </div>
    </div>
  );
};

export const ProxySetting = () => {
  const [proxyModalStatus, setProxyModalStatus] = useModal();
  const [proxyList, setProxyList] = useState<LocalProxy[]>([]);

  function getProxyList() {
    request.get("/proxy").then(({ data }) => {
      setProxyList(data.proxy || []);
      console.log("%c Line:14 🍕 data", "color:#ed9ec7", data);
    });
  }

  useEffect(() => {
    getProxyList();
  }, []);

  return (
    <Panel title="Proxy Settings">
      <PanelSection title="Proxy" subTitle="">
        <ProxyModal
          dialogStatus={proxyModalStatus}
          setDialogStatus={setProxyModalStatus}
          afterConfirm={getProxyList}
          afterCancel={() => {}}
        />
      </PanelSection>
      <div></div>
      <div>
        {proxyList.map((proxy) => {
          return <ProxyItem proxy={proxy} />;
        })}
      </div>
    </Panel>
  );
};
