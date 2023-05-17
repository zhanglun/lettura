import classNames from "classnames";
import React, { ReactNode } from "react";

export interface IconProps {
  onClick?: () => void;
  children?: ReactNode;
  className?: string | undefined;
  disable?: boolean;
}

export const Icon = (props: IconProps) => {
  const { onClick = () => {}, disable, children, className } = props;

  return (
    <span
      onClick={onClick}
      className={classNames(
        "flex items-center justify-center rounded hover:text-accent-foreground hover:bg-accent",
        `w-8 h-8`,
        { "bg-muted cursor-not-allowed" : disable},
        className
      )}
    >
      {children}
    </span>
  );
};
