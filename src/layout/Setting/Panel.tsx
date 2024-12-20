import React from "react";
import clsx from "clsx";
import { Heading, Separator } from "@radix-ui/themes";

declare const ORIENTATIONS: readonly ["horizontal", "vertical"];
type Orientation = typeof ORIENTATIONS[number];

export interface PanelProps {
  title: string;
  subTitle?: string;
  children?: React.ReactNode;
}

export const Panel = (props: PanelProps) => {
  const { title, subTitle, children } = props;

  return (
    <div className="space-y-6 outline-none">
      <div className="mb-5">
        <Heading size="3">{title}</Heading>
        {subTitle && <p className="text-sm mb-3 mt-2 text-[var(--gray-11)]">{subTitle}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
};

export interface PanelSectionProps extends PanelProps {
  orientation?: Orientation
}

export const PanelSection = (props: PanelSectionProps) => {
  const { title, subTitle, children, orientation = 'horizontal' } = props;

  return (
    <div className={clsx("space-y-2 flex", {
      "items-center justify-between": orientation === 'horizontal',
      "flex-col": orientation === 'vertical',
    })}>
      <div className="flex-0">
        <h3 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ">
          {title}
        </h3>
        {subTitle && <p className="text-sm mt-2 text-[var(--gray-11)]">{subTitle}</p>}
      </div>
      <div className="flex-0">{children}</div>
    </div>
  );
};
