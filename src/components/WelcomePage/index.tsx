import React from "react";
import bg from "./bg.svg";
import styles from "./welcome.module.scss";

export const WelcomePage = () => {
  return (
    <div className={styles.box}>
      <div className={styles.placeholder}>
        <img src={bg} className={styles.bg} />
      </div>
    </div>
  );
};
