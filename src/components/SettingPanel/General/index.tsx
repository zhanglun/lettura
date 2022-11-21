import React, { useEffect, useState } from "react";
import { Input, Select } from "@douyinfe/semi-ui";
import * as dataAgent from "../../../helpers/dataAgent";
import styles from "../setting.module.scss";

console.log(styles);

export const General = () => {
  const [localProxyConfig, setLocalProxyConfig] = useState<LocalProxy>({
    protcol: '',
    ip: "",
    port: "",
  });

  const handleSaveLocalProxy = (cfg: LocalProxy) => {
    dataAgent
      .updateProxy({
        ...cfg,
      })
      .then((res) => {});
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
          protcol: local_proxy.protcol,
          ip: local_proxy.ip,
          port: local_proxy.port,
        });
      }
    });
  }, []);

  return (
    <div className={styles.panel}>
      <h1 className={styles.panelTitle}>General</h1>
      <div className={styles.panelBody}>
        <div className={styles.section}>
          <p className={styles.options}>Proxy</p>
          <div className={styles.proxyFields}>
            <div>
              Protocol:{" "}
              <Select
                style={{ width: '100%' }}
                value={localProxyConfig.ip}
                onChange={(protcol) => handleLocalProxyChange("protocol", protcol as string)}
              >
                <Select.Option value={"http"}>http</Select.Option>
                <Select.Option value={"https"}>https</Select.Option>
                <Select.Option value={"sock4"}>sock4</Select.Option>
                <Select.Option value={"sock5"}>sock5</Select.Option>
              </Select>
            </div>
            <div>
              IP:{" "}
              <Input
                type="text"
                value={localProxyConfig.ip}
                onChange={(ip) => handleLocalProxyChange("ip", ip)}
              />
            </div>
            <div>
              Port:{" "}
              <Input
                type="text"
                value={localProxyConfig.port}
                onChange={(port) => handleLocalProxyChange("port", port)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
