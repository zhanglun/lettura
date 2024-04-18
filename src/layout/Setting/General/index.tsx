import React, { useEffect, useState } from "react";
import * as dataAgent from "../../../helpers/dataAgent";
import { Panel, PanelSection } from "../Panel";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBearStore } from "@/stores";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const intervalOptions = [
  {
    value: 0,
    label: "Manual",
  },
  {
    value: 1,
    label: "1 hour",
  },
  {
    value: 6,
    label: "6 hour",
  },
  {
    value: 12,
    label: "12 hours",
  },
  {
    value: 24,
    label: "24 hours",
  },
];

export const General = () => {
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));
  const [localProxyConfig, setLocalProxyConfig] = useState<LocalProxy>({
    protocol: "",
    ip: "",
    port: "",
  });
  const [threads, setThreads] = useState<number>(1);
  const [updateInterval, setUpdateInterval] = useState<number>(0);

  const handleSaveLocalProxy = (cfg: LocalProxy) => {
    dataAgent
      .updateProxy({
        ...cfg,
      })
      .then((res) => {
        console.log("%c Line:57 🥤 res", "color:#3f7cff", res);
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

  const handleThreadsChange = (val: number) => {
    setThreads(val);

    dataAgent.updateThreads(val).then((res) => {
      console.log("res ===>", res);
    });
  };

  const handleUpdateIntervalChange = (val: number) => {
    setUpdateInterval(val);

    store.updateUserConfig({
      ...store.userConfig,
      update_interval: val,
    });
  };

  useEffect(() => {
    dataAgent.getUserConfig().then(({ data: cfg }) => {
      console.log("update use config", cfg);

      const { local_proxy, threads, update_interval } = cfg as UserConfig;

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

      if (update_interval) {
        setUpdateInterval(update_interval);
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
      <Separator className="mt-6" />
      <PanelSection title="Update Interval (WIP)" subTitle="set the update interval">
        <Select
          value={updateInterval.toString()}
          onValueChange={(v: string) => handleUpdateIntervalChange(parseInt(v, 10))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Change update interval" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {intervalOptions.map((opt) => {
                return (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </PanelSection>
      <Separator className="mt-6" />
      <PanelSection title="Thread" subTitle="set the concurrent number of requests (from 1 to 5)">
        <Input
          className="w-[200px]"
          type="number"
          step={1}
          min={1}
          max={5}
          value={threads}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleThreadsChange(parseInt(e.target.value, 10) as unknown as number)
          }
        />
      </PanelSection>
      <Separator className="mt-6" />
      <PanelSection title="Purge articles older than" subTitle="save your disk (0 disables)">
        <div className="flex items-center gap-2">
          <Input
            className="w-[200px]"
            type="number"
            step={1}
            min={0}
            max={1825}
            value={store.userConfig.purge_on_days}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              store.updateUserConfig({
                ...store.userConfig,
                purge_on_days: parseInt(e.target.value, 10) as unknown as number,
              });
            }}
          />
          <span>days</span>
        </div>
      </PanelSection>
      <Separator className="mt-6" />
      <PanelSection title="Purge unread articles">
        <div>
          <Switch
            checked={store.userConfig.purge_unread_articles}
            onCheckedChange={(val: boolean) => {
              store.updateUserConfig({
                ...store.userConfig,
                purge_unread_articles: val,
              });
            }}
            aria-readonly
          />
        </div>
      </PanelSection>
    </Panel>
  );
};
