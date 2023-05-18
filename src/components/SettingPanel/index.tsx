import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import classnames from "classnames";
import { ArrowLeft, Cog, Database, Palette, Rss } from "lucide-react";
import { RouteConfig } from "../../config";
import styles from "./setting.module.scss";

function SettingPanel() {
  return (
    <div className={styles.container}>
      <div className={`sticky-header ${styles.header}`}>
        <div
          className={classnames(
            styles.title,
            "p-4 pl-5 font-bold text-detail-headline"
          )}
        >
          <span className={styles.menuIcon}>
            <ArrowLeft size={16} />
          </span>
          Settings
        </div>
      </div>
      <div className={styles.sidebar}>
        <ul>
          <li>
            <NavLink
              to={RouteConfig.SETTINGS_GENERAL}
              className={({ isActive }) =>
                classnames(styles.menuItem, "hover:text-primary", {
                  "font-bold text-primary": isActive,
                  "text-detail-paragraph": !isActive,
                })
              }
            >
              <Cog size={16} />
              General
            </NavLink>
          </li>
          {/* <li>
            <NavLink
              to={RouteConfig.SETTINGS_APPEARANCE}
              className={({ isActive }) =>
                classnames(styles.menuItem, "hover:text-primary", {
                  "font-bold text-primary": isActive,
                  "text-detail-paragraph": !isActive,
                })
              }
            >
              <Palette size={16} />
              Appearance
            </NavLink>
          </li> */}
          <li>
            <NavLink
              to={RouteConfig.SETTINGS_FEED_MANAGER}
              className={({ isActive }) =>
                classnames(styles.menuItem, "hover:text-primary", {
                  "font-bold text-primary": isActive,
                  "text-detail-paragraph": !isActive,
                })
              }
            >
              <Database size={16} />
              Feed Manager
            </NavLink>
          </li>
          <li>
            <NavLink
              to={RouteConfig.SETTINGS_IMPORT}
              className={({ isActive }) =>
                classnames(styles.menuItem, "hover:text-primary", {
                  "font-bold text-primary": isActive,
                  "text-detail-paragraph": !isActive,
                })
              }
            >
              <Rss size={16} />
              Import/Export
            </NavLink>
          </li>
        </ul>
      </div>
      <div className={styles.main}>
        <Outlet />
      </div>
    </div>
  );
}

export { SettingPanel };
