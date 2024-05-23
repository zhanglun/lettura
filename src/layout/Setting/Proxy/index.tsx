import { Button, Switch } from "@radix-ui/themes";
import { Panel, PanelSection } from "../Panel";
import { PlusCircle } from "lucide-react";
import { ProxyModal } from "./ProxyModal";
import { useEffect, useState } from "react";
import { request } from "@/helpers/request";
import { useModal } from "@/components/Modal/useModal";

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
      <PanelSection title="Proxy" subTitle="d">
        <Switch />
        <div>
          <Button variant="ghost">
            <PlusCircle />
            Add Proxy
          </Button>
        </div>
        <div>
          {proxyList.map((proxy) => {
            return (
              <div>
                {proxy.protocol}://{proxy.server}:{proxy.port}
              </div>
            );
          })}
        </div>
      </PanelSection>
      <div>
        <ProxyModal
          dialogStatus={proxyModalStatus}
          setDialogStatus={setProxyModalStatus}
          afterConfirm={getProxyList}
          afterCancel={() => {}}
        />
      </div>
      <div>TODO</div>
    </Panel>
  );
};
