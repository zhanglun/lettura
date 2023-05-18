import React, {useEffect, useState} from "react";
import * as dataAgent from "../../../helpers/dataAgent";
import {Panel, PanelSection} from "../Panel";
import {Input} from '@/components/ui/input';

export const General = () => {
  const [localProxyConfig, setLocalProxyConfig] = useState<LocalProxy>({
    protocol: "",
    ip: "",
    port: "",
  });
  const [threads, setThreads] = useState<number>(1);

  const handleSaveLocalProxy = (cfg: LocalProxy) => {
    dataAgent
      .updateProxy({
        ...cfg,
      })
      .then((res) => {
      });
  };

  const handleLocalProxyChange = (key: string, val: string) => {
    const cfg = Object.assign(
      {...localProxyConfig},
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

  useEffect(() => {
    dataAgent.getUserConfig().then((cfg: any) => {
      console.log("update use config", cfg);

      const {local_proxy, threads} = cfg as UserConfig;

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
    <Panel title="General">
      <PanelSection title="Proxy" subTitle="use a proxy server for connection">
        <div className="grid gap-1 grid-cols-[120px_10px_60px] items-center">
          <Input
            type="text"
            value={localProxyConfig.ip}
            className="tracking-wide"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalProxyChange("ip", e.target.value)}
          />
          <span className="text-center">:</span>
          <Input
            type="text"
            className="tracking-wide"
            value={localProxyConfig.port}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocalProxyChange("port", e.target.value)}
          />
        </div>
      </PanelSection>
      <PanelSection
        title="Update Interval"
        subTitle="set the update interval"
      ></PanelSection>
      <PanelSection
        title="Thread"
        subTitle="set the concurrent number of requests (from 1 to 10)"
      >
        <Input
          type="number"
          step={1}
          min={1}
          max={10}
          value={threads}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleThreadsChange(e.target.value as unknown as number)
          }
        />
      </PanelSection>
    </Panel>
  );
};
