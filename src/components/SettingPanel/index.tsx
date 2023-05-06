import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  CircleStackIcon,
  HomeIcon,
  RssIcon,
} from "@heroicons/react/24/outline";
import { RouteConfig } from "../../config";
import styles from "./setting.module.scss";
import classnames from "classnames";

function SettingPanel() {
  return (
    <div className={styles.container}>
      <div className={`sticky-header ${styles.header}`}>
        <div className={classnames(styles.title, 'text-2xl p-4 pl-5 font-bold')}>Settings</div>
      </div>
      <div className={styles.sidebar}>
        <ul>
          <li>
            <NavLink
              to={RouteConfig.SETTINGS_GENERAL}
              className={({ isActive }) =>
                isActive ?  classnames(styles.menuItem, 'font-bold text-primary') : styles.menuItem
              }
            >
              <HomeIcon className={"h-4 w-4"} />
              General
            </NavLink>
          </li>
          <li>
            <NavLink
              to={RouteConfig.SETTINGS_FEED_MANAGER}
              className={({ isActive }) =>
                isActive ?  classnames(styles.menuItem, 'font-bold text-primary') : styles.menuItem
              }
            >
              <CircleStackIcon className={"h-4 w-4"} />
              Feed Manager
            </NavLink>
          </li>
          <li>
            <NavLink
              to={RouteConfig.SETTINGS_IMPORT}
              className={({ isActive }) =>
                isActive ?  classnames(styles.menuItem, 'font-bold text-primary') : styles.menuItem
              }
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
