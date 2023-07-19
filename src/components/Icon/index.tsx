import classNames from "classnames";
import React, { ReactNode } from "react";

export interface IconProps {
  onClick?: () => void;
  children?: ReactNode;
  className?: string | undefined;
  disable?: boolean;
  active?: boolean;
}

export const Icon = React.forwardRef((props: IconProps, ref: any) => {
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
        { "bg-muted cursor-not-allowed": disable },
        { "bg-muted": active },
        className,
      )}
    >
      {children}
    </span>
  );
});
