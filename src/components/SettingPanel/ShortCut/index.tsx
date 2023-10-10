import React from "react";
import { Panel, PanelSection } from "../Panel";
import classNames from "classnames";
import { Separator } from "@/components/ui/separator";
import { Kbd } from "@/components/Kbd";

export const KeyBox = (props: {
  name: string[] | string;
  description: string;
}) => {
  return (
    <div className="w-full flex justify-between py-2">
      <span className="text-sm">{props.description}</span>
      <span>
        {[].concat(props.name as any).map((name: string) => {
          let group: React.ReactNode[] = [];

          name.split(" ").forEach((s) => {
            if (s === "+") {
              group.push(
                <span
                  className={classNames(
                    "inline-block text-[0.75em] px-1 py-0 align-text-top"
                  )}
                >
                  +
                </span>
              );
            } else {
              group.push(
                <Kbd val={s} />
              );
            }
          });

          return <span className="mx-2">{group}</span>;
        })}
      </span>
    </div>
  );
};

export const Shortcut = () => {
  return (
    <Panel title="Shortcut">
      <PanelSection title="">
        <div className="w-full">
          <KeyBox name="n" description="View next article" />
          <Separator />
          <KeyBox
            name={["N", "Shift + n"]}
            description="View previous article"
          />
          <Separator />
          <KeyBox name="j" description="Scroll down" />
          <Separator />
          <KeyBox name="k" description="Scroll up" />
          <Separator />
          <KeyBox name="o" description="Open link i browser" />
        </div>
      </PanelSection>
    </Panel>
  );
};
