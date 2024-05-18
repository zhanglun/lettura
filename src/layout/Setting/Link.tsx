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
          "inline-flex items-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none hover:bg-[var(--gray-3)] h-9 py-2 px-4 hover:underline justify-start",
          {
            "bg-accent-10 hover:bg-accent-10 text-[var(--accent-contrast)]": isActive,
          }
        )
      }
    >
      {children}
    </NavLink>
  );
};
