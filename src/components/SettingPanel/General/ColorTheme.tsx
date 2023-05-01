import React, { useEffect, useState } from "react";
import { Input, InputNumber, RadioGroup, Radio } from "@douyinfe/semi-ui";
import * as dataAgent from "../../../helpers/dataAgent";
import styles from "../setting.module.scss";

export const ColorTheme = () => {
  const [theme, setTheme] = useState("1");

  const handleSaveTheme = (theme: string) => {
    dataAgent
      .updateTheme(theme)
      .then((res) => {});
  };

  const onThemeChange = (val: string) => {
    setTheme(val);
    document.body.dataset.palette = val;
    handleSaveTheme(val.toString());
  };

  useEffect(() => {
    dataAgent.getUserConfig().then((cfg: any) => {
      console.log("update use config", cfg);

      const { theme } = cfg as UserConfig;

      if (theme) {
        setTheme(theme);
        document.body.dataset.palette = theme;
      }
    });
  }, []);

  return (
    <div className={styles.section}>
      <p className={styles.options}>Choose you color theme</p>
      {theme}
      <div>
        <RadioGroup
          onChange={(e) => onThemeChange(e.target.value)}
          value={parseInt(theme, 10)}
          aria-label="select theme"
          name="theme"
        >
          {[...new Array(17).keys()].map((idx) => {
            return <Radio value={idx + 1}>{idx + 1}</Radio>;
          })}
        </RadioGroup>
      </div>
    </div>
  );
};
