import React, { useEffect, useState } from "react";
import { Input, InputNumber, RadioGroup, Radio } from "@douyinfe/semi-ui";
import * as ThemeVariables from "../../../styles/happyhues/ts/variables";
import * as dataAgent from "../../../helpers/dataAgent";
import styles from "../setting.module.scss";

const ThemeMap: { [key: string]: { [key2: string]: string } } = {};

Object.keys(ThemeVariables).forEach((key) => {
  const group = key.split(/(ColorPalette\d*)(Section.*)/);

  if (group[1] && group[2]) {
    ThemeMap[group[1]] = ThemeMap[group[1]] || {};
    // @ts-ignore
    ThemeMap[group[1]][group[2]] = ThemeVariables[key];
  }
});

export const ColorTheme = () => {
  const [theme, setTheme] = useState("1");

  const handleSaveTheme = (theme: string) => {
    dataAgent.updateTheme(theme).then((res) => {
      document.body.dataset.palette = theme;

      // keep in localStorage for first load
      window.localStorage.setItem("palette", theme);
    });
  };

  const onThemeChange = (val: string) => {
    setTheme(val);

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
          type="card"
        >
          {[...new Array(17).keys()].map((idx) => {
            return (
              <div
                className="grid gap-2 grid-flow-row items-center mb-2"
                key={idx}
              >
                <Radio
                  value={idx + 1}
                  className="flex flex-row items-center justify-center"
                >
                  <div className="">
                    <div
                      className="flex border border-stroke p-4 pr-7 rounded"
                      style={{
                        backgroundColor:
                          ThemeMap[`ColorPalette${idx + 1}`]
                            .Section1ElementsBackground,
                      }}
                    >
                      <div
                        className="w-8 h-8 -mr-3 border-2 border-[#2b2c34]  rounded-full"
                        style={{
                          backgroundColor:
                            ThemeMap[`ColorPalette${idx + 1}`]
                              .Section1IllustrationHighlight,
                        }}
                      ></div>
                      <div
                        className="w-8 h-8 -mr-3 border-2 border-[#2b2c34] rounded-full"
                        style={{
                          backgroundColor:
                            ThemeMap[`ColorPalette${idx + 1}`]
                              .Section1IllustrationSecondary,
                        }}
                      ></div>
                      <div
                        className="w-8 h-8 -mr-3 border-2 border-[#2b2c34]  rounded-full"
                        style={{
                          backgroundColor:
                            ThemeMap[`ColorPalette${idx + 1}`]
                              .Section1IllustrationTertiary,
                        }}
                      ></div>
                      <div
                        className="w-8 h-8 -mr-3 border-2 border-[#2b2c34]  rounded-full"
                        style={{
                          backgroundColor:
                            ThemeMap[`ColorPalette${idx + 1}`]
                              .Section1IllustrationStroke,
                        }}
                      ></div>
                      <div
                        className="w-8 h-8 -mr-3 border-2 border-[#2b2c34]  rounded-full"
                        style={{
                          backgroundColor:
                            ThemeMap[`ColorPalette${idx + 1}`]
                              .Section1IllustrationMain,
                        }}
                      ></div>
                    </div>
                  </div>
                </Radio>
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
};
