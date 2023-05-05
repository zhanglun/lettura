import React, { useEffect, useState } from "react";
import { Input, InputNumber, RadioGroup, Radio } from "@douyinfe/semi-ui";
import * as ThemeVariables from '../../../styles/happyhues/ts/variables';
import * as dataAgent from "../../../helpers/dataAgent";
import styles from "../setting.module.scss";

const ThemeMap: { [key: string] : { [key2: string] : string } } = {}

Object.keys(ThemeVariables).forEach((key) => {
  const group = key.split(/(Palette\d*)(Color.*)/);

  if (group[1] && group[2]) {
    ThemeMap[group[1]] = ThemeMap[group[1]] || {};
    // @ts-ignore
    ThemeMap[group[1]][group[2]] = ThemeVariables[key];
  }
})

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
      <div className="mt-6">
        <RadioGroup
          onChange={(e) => onThemeChange(e.target.value)}
          value={parseInt(theme, 10)}
          aria-label="select theme"
          name="theme"
        >
          {[...new Array(17).keys()].map((idx) => {
            return <div className="grid gap-2 grid-flow-row items-center" key={idx}>
              <div className="">
                <div
                  className="flex border border-stroke p-4 pr-7 rounded"
                  style={{
                    backgroundColor: ThemeMap[`Palette${idx+1}`].Color1ElementsBackground
                  }}>
                  <div
                    className="w-8 h-8 -mr-3 border-2 border-[#2b2c34]  rounded-full"
                    style={{
                      backgroundColor: ThemeMap[`Palette${idx+1}`].Color1IllustrationHighlight
                    }}></div>
                  <div
                    className="w-8 h-8 -mr-3 border-2 border-[#2b2c34] rounded-full"
                    style={{
                      backgroundColor: ThemeMap[`Palette${idx+1}`].Color1IllustrationSecondary
                    }}></div>
                  <div
                    className="w-8 h-8 -mr-3 border-2 border-[#2b2c34]  rounded-full"
                    style={{
                      backgroundColor: ThemeMap[`Palette${idx+1}`].Color1IllustrationTertiary
                    }}></div>
                  <div
                    className="w-8 h-8 -mr-3 border-2 border-[#2b2c34]  rounded-full"
                    style={{
                      backgroundColor: ThemeMap[`Palette${idx+1}`].Color1IllustrationStroke
                    }}></div>
                  <div
                    className="w-8 h-8 -mr-3 border-2 border-[#2b2c34]  rounded-full"
                    style={{
                      backgroundColor: ThemeMap[`Palette${idx+1}`].Color1IllustrationMain
                    }}></div>
                </div>
              </div>
              <Radio value={idx + 1}></Radio>
            </div>
          })}
        </RadioGroup>
      </div>
    </div>
  );
};
