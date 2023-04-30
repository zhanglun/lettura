import React, { useEffect, useState } from "react";
import { Input, InputNumber, RadioGroup, Radio } from "@douyinfe/semi-ui";
import * as dataAgent from "../../../helpers/dataAgent";
import styles from "../setting.module.scss";

export const General = () => {
  const [localProxyConfig, setLocalProxyConfig] = useState<LocalProxy>({
    protocol: "",
    ip: "",
    port: "",
  });
  const [threads, setThreads] = useState<number>(1);
  const [themeMode, setThemeMode] = useState("light");

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

  const handleThreadsChange = (val: number) => {
    setThreads(val);
    dataAgent.updateThreads(val).then((res) => {
      console.log("res ===>", res);
    });
  };

  const onThemeChange = (val: string) => {
    setThemeMode(val);
    // document.body.dataset.theme = val;
    document.body.dataset.palette = val;
  };

  useEffect(() => {
    dataAgent.getUserConfig().then((cfg: any) => {
      console.log("update use config", cfg);

      const { local_proxy, threads } = cfg as UserConfig;

      if (local_proxy) {
        setLocalProxyConfig({
          protocol: local_proxy.protocol,
          ip: local_proxy.ip,
          port: local_proxy.port,
        });
      }

      if (threads) {
        setThreads(threads);
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
            {/* <div>
              Protocol:{" "}
              <Select
                style={{ width: '100%' }}
                value={localProxyConfig.protocol}
                onChange={(protocol) => handleLocalProxyChange("protocol", protocol as string)}
              >
                <Select.Option value={"http"}>http</Select.Option>
                <Select.Option value={"https"}>https</Select.Option>
                <Select.Option value={"sock4"}>sock4</Select.Option>
                <Select.Option value={"sock5"}>sock5</Select.Option>
              </Select>
            </div> */}
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
        <div className={styles.section}>
          <p className={styles.options}>Auto update interval (minutes)</p>
        </div>
        <div className={styles.section}>
          <p className={styles.options}>
            Number of update threads (from 1 to 10)
          </p>
          <InputNumber
            step={1}
            min={1}
            max={10}
            value={threads}
            onChange={(thread: number | string) =>
              handleThreadsChange(thread as number)
            }
          />
        </div>
      </div>
      <div className={styles.section}>
        {/* <p className={styles.options}>Choose you theme mode</p>
        <div>
          <RadioGroup
            onChange={(e) => onThemeChange(e.target.value)}
            value={themeMode}
            aria-label="单选组合示例"
            name="theme-mode"
          >
            <Radio value={"light"}>Light</Radio>
            <Radio value={"dark"}>Dark</Radio>
          </RadioGroup>
        </div> */}
        <p className={styles.options}>Choose you color theme</p>
        <div>
          <RadioGroup
            onChange={(e) => onThemeChange(e.target.value)}
            value={themeMode}
            aria-label="单选组合示例"
            name="theme-mode"
          >
            {[...new Array(17).keys()].map((idx) => {
              return <Radio value={idx + 1}>{idx + 1}</Radio>;
            })}
          </RadioGroup>
        </div>
      </div>
    </div>
  );
};
