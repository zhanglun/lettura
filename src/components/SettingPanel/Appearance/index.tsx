import React, { useEffect, useState } from "react";
import styles from "../setting.module.scss";
// import { ColorTheme } from "./ColorTheme";

export const Appearance = () => {
  return (
    <div className={styles.panel}>
      <h1 className={styles.panelTitle}>Appearance</h1>
      <div className={styles.panelBody}>
        {/* <ColorTheme /> */}
      </div>
    </div>
  );
};
