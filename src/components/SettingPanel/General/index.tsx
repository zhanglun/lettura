import React, { useState } from "react";
import { Input, Button } from "@douyinfe/semi-ui";
import * as dataAgent from "../../../helpers/dataAgent";

export const General = () => {
  const [localProxyConfig, setLocalProxyConfig] = useState({
    ip: "",
    port: "",
  });

  const handleLocalProxyChange = (key: string, val: string) => {
    const cfg = Object.assign(
      { ...localProxyConfig },
      {
        [key]: val,
      }
    );

    console.log(cfg);

    setLocalProxyConfig(cfg);
  };

  const handleSaveLocalProxy = () => {
    dataAgent.updateUserConfig(localProxyConfig).then((res) => {
      console.log('update use config', res)
    })
  }

  return (
    <div>
      <h2>General</h2>
      <div>
        <h3>Proxy</h3>
        <div>
          <p>Local Proxy</p>
          IP Address:{" "}
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
          <Button type={"primary"} onClick={handleSaveLocalProxy}>Save</Button>
        </div>
      </div>
    </div>
  );
};
