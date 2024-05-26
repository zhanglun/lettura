import { Panel, PanelSection } from "../Panel";
import { useBearStore } from "@/stores";
import { TextField, Select, Switch, Separator } from "@radix-ui/themes";
import { useEffect, useState } from "react";

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

const purgeOptions = [
  {
    value: 0,
    label: "Never",
  },
  {
    value: 1,
    label: "today",
  },
  {
    value: 7,
    label: "one week",
  },
  {
    value: 14,
    label: "two weeks",
  },
  {
    value: 30,
    label: "a month",
  },
  {
    value: 180,
    label: "six month",
  },
  {
    value: 360,
    label: "one year",
  },
];

export const General = () => {
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));

  const [localProxy, setLocalProxy] = useState({} as LocalProxy);

  console.log("%c Line:67 🥥 store.userConfig.proxy", "color:#fca650", store.userConfig.proxy);

  const handleLocalProxyChange = (key: string, val: string) => {
    const p = {
      ...localProxy,
      ...{
        [key]: val,
      },
    };
    setLocalProxy(p);

    if (p.server && p.port) {
      store.updateUserConfig({
        ...store.userConfig,
        proxy: p,
      });
    }
  };

  useEffect(() => {
    setLocalProxy(store.userConfig.proxy || ({} as LocalProxy));
  }, [store.userConfig]);

  return (
    <Panel title="General">
      <PanelSection title="Update Interval (🚧WIP)" subTitle="set the update interval">
        <Select.Root
          value={store.userConfig.update_interval?.toString()}
          onValueChange={(v: string) => {
            store.updateUserConfig({
              ...store.userConfig,
              update_interval: parseInt(v, 10),
            });
          }}
        >
          <Select.Trigger />
          <Select.Content>
            <Select.Group>
              {intervalOptions.map((opt) => {
                return (
                  <Select.Item key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </Select.Item>
                );
              })}
            </Select.Group>
          </Select.Content>
        </Select.Root>
      </PanelSection>
      <Separator className="mt-6" size="4" />
      <PanelSection title="Thread" subTitle="set the concurrent number of requests (from 1 to 5)">
        <Select.Root
          value={store.userConfig.threads?.toString()}
          onValueChange={(v: string) => {
            store.updateUserConfig({
              ...store.userConfig,
              threads: parseInt(v, 10),
            });
          }}
        >
          <Select.Trigger />
          <Select.Content>
            {[1, 2, 3, 4, 5].map((opt) => {
              return (
                <Select.Item key={opt} value={opt.toString()}>
                  {opt}
                </Select.Item>
              );
            })}
          </Select.Content>
        </Select.Root>
      </PanelSection>
      <Separator className="mt-6" size="4" />
      <PanelSection title="Purge articles older than" subTitle="save your disk">
        <div className="flex items-center gap-2">
          <Select.Root
            value={store.userConfig.purge_on_days?.toString()}
            onValueChange={(v: string) =>
              store.updateUserConfig({
                ...store.userConfig,
                purge_on_days: parseInt(v, 10),
              })
            }
          >
            <Select.Trigger />
            <Select.Content>
              {purgeOptions.map((opt) => {
                return (
                  <Select.Item key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </Select.Item>
                );
              })}
            </Select.Content>
          </Select.Root>
        </div>
      </PanelSection>
      <Separator className="mt-6" size="4" />
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
