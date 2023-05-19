import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import classnames from "classnames";
import { ArrowLeft, Cog, Database, Palette, Rss } from "lucide-react";
import { RouteConfig } from "../../config";
import styles from "./setting.module.scss";
import { Icon } from "../Icon";

function SettingPanel() {
  return (
    <div className={styles.container}>
      <div>
        <div
          className={"flex items-center p-4 font-semibold text-2xl"}
        >
          <Icon className="mr-3">
            <ArrowLeft size={22} />
          </Icon>
          Settings
        </div>
        <div className="px-4 py-2">
          <NavLink
            to={RouteConfig.SETTINGS_GENERAL}
            className={({ isActive }) =>
              classnames(
                "flex items-center px-2 h-10 rounded-md cursor-pointer mt-[2px]",
                {
                  "bg-primary text-primary-foreground font-bold": isActive,
                  "hover:bg-primary hover:text-primary-foreground": !isActive,
                }
              )
            }
          >
            <Cog size={16} className="mr-4" />
            General
          </NavLink>
          <NavLink
            to={RouteConfig.SETTINGS_APPEARANCE}
            className={({ isActive }) =>
              classnames(
                "flex items-center px-2 h-10 rounded-md cursor-pointer mt-[2px]",
                {
                  "bg-primary text-primary-foreground font-bold": isActive,
                  "hover:bg-primary hover:text-primary-foreground": !isActive,
                }
              )
            }
          >
            <Palette size={16} className="mr-3" />
            Appearance
          </NavLink>
          <NavLink
            to={RouteConfig.SETTINGS_FEED_MANAGER}
            className={({ isActive }) =>
              classnames(
                "flex items-center px-2 h-10 rounded-md cursor-pointer mt-[2px]",
                {
                  "bg-primary text-primary-foreground font-bold": isActive,
                  "hover:bg-primary hover:text-primary-foreground": !isActive,
                }
              )
            }
          >
            <Database size={16} className="mr-3" />
            Content
          </NavLink>
          <NavLink
            to={RouteConfig.SETTINGS_IMPORT}
            className={({ isActive }) =>
              classnames(
                "flex items-center px-2 h-10 rounded-md cursor-pointer mt-[2px]",
                {
                  "bg-primary text-primary-foreground font-bold": isActive,
                  "hover:bg-primary hover:text-primary-foreground": !isActive,
                }
              )
            }
          >
            <Rss size={16} className="mr-3" />
            Import/Export
          </NavLink>
        </div>
      </div>
      <div className="px-12 py-16">
        <Outlet />
      </div>
    </div>
  );
}

export { SettingPanel };
