import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { CircleStackIcon, HomeIcon, RssIcon } from "@heroicons/react/24/outline";
import { RouteConfig } from "../../config";
import styles from "./setting.module.scss";

function SettingPanel() {
  return (
    <div className={styles.container}>
      <div className={`sticky-header ${styles.header}`}>
        <div className={styles.title}>Settings</div>
      </div>
      <div className={styles.sidebar}>
        <ul>
          <li>
            <NavLink
              to={RouteConfig.SETTINGS_GENERAL}
              className={({ isActive }) => isActive ? styles.menuItemActive : styles.menuItem}
            >
              <HomeIcon className={"h-4 w-4"} />General
            </NavLink>
          </li>
          <li>
            <NavLink
              to={RouteConfig.SETTINGS_FEED_MANAGER}
              className={({ isActive }) => isActive ? styles.menuItemActive : styles.menuItem}
            >
              <CircleStackIcon className={"h-4 w-4"} />
              Feed Manager
            </NavLink>
          </li>
          <li>
            <NavLink
              to={RouteConfig.SETTINGS_IMPORT}
              className={({ isActive }) => isActive ? styles.menuItemActive : styles.menuItem}
            >
              <RssIcon className={"h-4 w-4"} />
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
