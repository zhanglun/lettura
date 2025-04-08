import React from "react";
import { Panel, PanelSection } from "../Panel";
import classNames from "classnames";
import { Kbd, Separator } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

export const KeyBox = (props: { name: string[] | string; description: string }) => {
  return (
    <div className="w-full flex justify-between py-2">
      <span className="text-sm">{props.description}</span>
      <span>
        {[].concat(props.name as any).map((name: string) => {
          let group: React.ReactNode[] = [];

          name.split(" ").forEach((s) => {
            if (s === "+") {
              group.push(<span key={s} className={classNames("inline-block text-[0.75em] px-1 py-0 align-text-top")}>+</span>);
            } else {
              group.push(<Kbd key={s}>{s}</Kbd>);
            }
          });

          return <span className="mx-2" key={name}>{group}</span>;
        })}
      </span>
    </div>
  );
};

export const Shortcut = () => {
  const { t } = useTranslation();

  return (
    <Panel title={t("Shortcuts")}>
      <PanelSection title="" orientation="vertical">
        <div className="w-full">
          <KeyBox name="c" description={t("Subscribe feed")} />
          <Separator size="4" />
          <KeyBox name="n" description={t("View next article")} />
          <Separator size="4" />
          <KeyBox name={["Shift + n"]} description={t("View previous article")} />
          <Separator size="4" />
          <KeyBox name="j" description={t("Scroll down")} />
          <Separator size="4" />
          <KeyBox name="k" description={t("Scroll up")} />
          <Separator size="4" />
          <KeyBox name="o" description={t("Open link in browser")} />
        </div>
      </PanelSection>
    </Panel>
  );
};
