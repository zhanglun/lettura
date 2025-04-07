import { Panel, PanelSection } from "../Panel";
import { useBearStore } from "@/stores";
import { Select, Switch, Separator } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import i18next from "i18next";

const intervalOptions = [
  {
    value: 0,
    label: i18next.t("Manual"),
  },
  {
    value: 1,
    label: `1 ${i18next.t("hour")}`,
  },
  {
    value: 6,
    label: `6 ${i18next.t("hour")}`,
  },
  {
    value: 12,
    label: `12 ${i18next.t("hours")}`,
  },
  {
    value: 24,
    label: `24 ${i18next.t("hours")}`,
  },
];

const purgeOptions = [
  {
    value: 0,
    label: i18next.t("Never"),
  },
  {
    value: 1,
    label: i18next.t("today"),
  },
  {
    value: 7,
    label: i18next.t("one week"),
  },
  {
    value: 14,
    label: i18next.t("two weeks"),
  },
  {
    value: 30,
    label: i18next.t("a month"),
  },
  {
    value: 180,
    label: i18next.t("six month"),
  },
  {
    value: 360,
    label: i18next.t("one year"),
  },
];

const langs = {
  en: { nativeName: "English" },
  zh: { nativeName: "中文" },
};

export const General = () => {
  const { t, i18n } = useTranslation();
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));

  return (
    <Panel title={t("General")}>
      <PanelSection title={t("Update Interval")} subTitle={t("set the update interval")}>
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
      <PanelSection title={t("Thread")} subTitle={t("set the concurrent number of requests (from 1 to 5)")}>
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
      <PanelSection title={t("Purge articles older than")} subTitle={t("save your disk")}>
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
      <PanelSection title={t("Purge unread articles")}>
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
      <Separator className="mt-6" size="4" />
      <PanelSection title={t("Language")}>
        <div className="flex items-center gap-2">
          <Select.Root
            // value={store.userConfig.purge_on_days?.toString()}
            onValueChange={(v: string) => {
              console.log(v);
              i18n.changeLanguage(v);
            }}
          >
            <Select.Trigger />
            <Select.Content>
              {Object.keys(langs).map((key: string) => {
                return (
                  <Select.Item key={key} value={key}>
                    {langs[key].nativeName}
                  </Select.Item>
                );
              })}
            </Select.Content>
          </Select.Root>
        </div>
      </PanelSection>
    </Panel>
  );
};
