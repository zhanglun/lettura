import React from "react";
import { Link, Outlet } from "react-router-dom";
import { RouteConfig } from "../../config";
import styles from "./setting.module.css";

function SettingPanel() {
  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.title}>设置</div>
        <ul>
          <li><Link to={RouteConfig.SETTINGS_GENERAL}>General</Link></li>
          <li><Link to={RouteConfig.SETTINGS_APPEARANCE}>Appearance</Link></li>
          <li><Link to={RouteConfig.SETTINGS_NOTIFICATION}>Notification</Link></li>
          <li><Link to={RouteConfig.SETTINGS_FEED_MANAGER}>Feed Manager</Link></li>
          <li><Link to={RouteConfig.SETTINGS_IMPORT}>Import OPML</Link></li>
        </ul>
      </div>
      <Outlet />
    </div>
  );
}

export { SettingPanel };
