import React, { ReactNode } from "react";
import { NavLink, NavLinkProps } from "react-router-dom";
import classnames from "classnames";

export interface LinkProps extends NavLinkProps {}

export const Link = (props: LinkProps) => {
  const { to, children } = props;

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        classnames(
          "inline-flex items-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:text-accent-foreground h-10 py-2 px-4 hover:underline justify-start",
          {
            "bg-muted": isActive,
          },
        )
      }
    >
      {children}
    </NavLink>
  );
};
