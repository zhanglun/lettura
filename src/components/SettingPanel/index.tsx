import React from "react";
import { Link, Outlet } from "react-router-dom";
import { CircleStackIcon, HomeIcon, RssIcon } from "@heroicons/react/24/outline";
import { RouteConfig } from "../../config";
import styles from "./setting.module.css";

function SettingPanel() {
  return (
    <div className={styles.container}>
      <div className={`sticky-header ${styles.header}`}>
        <div className={styles.title}>设置</div>
      </div>
      <div className={styles.sidebar}>
        <ul>
          <li>
            <Link to={RouteConfig.SETTINGS_GENERAL} className={styles.menuItem}>
              <HomeIcon className={"h-4 w-4"}/>General
            </Link>
          </li>
          <li>
            <Link to={RouteConfig.SETTINGS_FEED_MANAGER} className={styles.menuItem}>
              <CircleStackIcon className={"h-4 w-4"}/>
              Feed Manager
            </Link>
          </li>
          <li>
            <Link to={RouteConfig.SETTINGS_IMPORT} className={styles.menuItem}>
              <RssIcon className={"h-4 w-4"} />
              Import/Export
            </Link>
          </li>
        </ul>
      </div>
      <div className={styles.main}>
        <Outlet/>
      </div>
    </div>
  );
}

export { SettingPanel };
