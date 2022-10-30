import React, { useEffect, useState } from "react";
import { Input } from "@douyinfe/semi-ui";
import * as dataAgent from "../../../helpers/dataAgent";

export const General = () => {
  const [localProxyConfig, setLocalProxyConfig] = useState<LocalProxy>({
    ip: "",
    port: "",
  });

  const handleSaveLocalProxy = (cfg: LocalProxy) => {
    dataAgent.updateProxy({
      ...cfg
    }).then((res) => {
    });
  };

  const handleLocalProxyChange = (key: string, val: string) => {
    const cfg = Object.assign(
      { ...localProxyConfig },
      {
        [key]: val,
      }
    );

    setLocalProxyConfig(cfg);
    handleSaveLocalProxy(cfg);
  };

  useEffect(() => {
    dataAgent.getUserConfig().then((cfg: any) => {
      console.log("update use config", cfg);

      const { local_proxy } = cfg as UserConfig;

      if (local_proxy) {
        setLocalProxyConfig({
          ip: local_proxy.ip,
          port: local_proxy.port,
        })
      }
    });
  }, []);

  return (
    <div>
      <h2>General</h2>
      <div>
        <h3>Proxy</h3>
        <div>
          IP:{" "}
          <Input
            type="text"
            value={localProxyConfig.ip}
            onChange={(ip) => handleLocalProxyChange("ip", ip)}
          />
          Port:{" "}
          <Input
            type="text"
            value={localProxyConfig.port}
            onChange={(port) => handleLocalProxyChange("port", port)}
          />
        </div>
      </div>
    </div>
  );
};
