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
        <h2 className="text-2xl font-semibold tracking-tight mb-4">{title}</h2>
        {subTitle && <p className="text-sm mb-3">{subTitle}</p>}
      </div>
      {children}
    </div>
  );
};

export interface PanelSectionProps extends PanelProps {}

export const PanelSection = (props: PanelSectionProps) => {
  const { title, subTitle, children } = props;

  return (
    <div className="pb-5 mb-5 border-b">
      <h3 className="text-base font-semibold tracking-tight mb-2">{title}</h3>
      {subTitle && <p className="text-sm mb-2">{subTitle}</p>}
      {children}
    </div>
  );
};
