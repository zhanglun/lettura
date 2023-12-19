import classNames from "classnames";
import React, { ReactNode } from "react";

export interface IconProps {
  onClick?: any;
  children?: ReactNode;
  className?: string | undefined;
  disable?: boolean;
  active?: boolean;
}

export const Icon = (props: IconProps) => {
  const {
    onClick = () => {},
    disable,
    active,
    children,
    className = "w-8 h-8",
  } = props;

  return (
    <span
      onClick={onClick}
      className={classNames(
        "flex items-center justify-center rounded hover:text-accent-foreground hover:bg-accent",
        {
          "text-muted cursor-not-allowed hover:bg-transparent hover:text-muted":
            disable,
        },
        { "bg-muted": active },
        className
      )}
    >
      {children}
    </span>
  );
};
