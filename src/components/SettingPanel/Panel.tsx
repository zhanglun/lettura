import React from "react";

export interface PanelProps {
  title: string;
  subTitle?: string;
  children?: React.ReactNode;
}

export const Panel = (props: PanelProps) => {
  const { title, subTitle, children } = props;

  return (
    <div className="">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold tracking-tight mb-6">{title}</h2>
        {subTitle && <p className="text-sm mb-3 text-[hsl(var(--foreground)_/_0.6)]">{subTitle}</p>}
      </div>
      {children}
    </div>
  );
};

export interface PanelSectionProps extends PanelProps {}

export const PanelSection = (props: PanelSectionProps) => {
  const { title, subTitle, children } = props;

  return (
    <div className="flex items-center justify-between pb-4 mb-6 mt-4 border-b">
      <div>
        <h3 className="text-base font-semibold tracking-tight mb-2">{title}</h3>
        {subTitle && <p className="text-sm mb-2 text-[hsl(var(--foreground)_/_0.6)]">{subTitle}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
};
