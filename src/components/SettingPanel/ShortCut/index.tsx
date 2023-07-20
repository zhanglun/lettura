import React from "react";
import { Panel, PanelSection } from "../Panel";
import classNames from "classnames";
import { Separator } from "@/components/ui/separator";

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
                <kbd
                  className="
              bg-[#fafafa]
              dark:bg-[hsla(232,15%,94%,0.12)]
              rounded-[0.1rem]
              shadow-[0_0.1rem_0_0.05rem_#b8b8b8,0_0.1rem_0_#b8b8b8,0_-0.1rem_0.2rem_#fff_inset]
              dark:shadow-[rgb(30,_32,_41)_0px_2px_0px_1px,_rgb(30,_32,_41)_0px_2px_0px_0px,_rgba(237,_238,_242,_0.2)_0px_-2px_4px_0px_inset]
              text-[#000000de]
              dark:text-[rgb(233,_235,_252)]
              inline-block
              text-[0.75em]
              px-1
              py-0
              align-text-top
              break-words
              "
                >
                  {s}
                </kbd>
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
