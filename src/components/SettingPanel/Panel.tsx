import React from "react";
import { Separator } from "@/components/ui/separator";

export interface PanelProps {
  title: string;
  subTitle?: string;
  children?: React.ReactNode;
}

export const Panel = (props: PanelProps) => {
  const { title, subTitle, children } = props;

  return (
    <div className="space-y-6">
      <div className="mb-5">
        <h3 className="text-lg font-medium tracking-tight">{ title }</h3>
        { subTitle && <p className="text-sm mb-3 mt-2 text-[hsl(var(--foreground)_/_0.6)]">{ subTitle }</p> }
      </div>
      <Separator className="mt-6"/>
      <div className="space-y-8">
        { children }
      </div>
    </div>
  );
};

export interface PanelSectionProps extends PanelProps {
}

export const PanelSection = (props: PanelSectionProps) => {
  const { title, subTitle, children } = props;

  return (
    <div className="space-y-2">
      <h3
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ">{ title }</h3>
      { subTitle && <p className="text-sm text-muted-foreground mt-2">{ subTitle }</p> }
      <div className="relative">{ children }</div>
    </div>
  );
};
