import React, { useEffect, useState } from "react";
import { useBearStore } from "@/stores";
import { Moon, Sun, CaseSensitive, Baseline } from "lucide-react";
import { ValueStep } from "./ValueStep";
import clsx from "clsx";

const FONTSIZE_OPTIONS = Array.from({ length: 12 }).map((_, idx) => {
  return {
    label: `${idx + 14}px`,
    value: idx + 14,
  };
});

const LINE_SPACING_OPTIONS = Array.from({ length: 8 }).map((_, idx) => {
  return {
    label: (idx * 0.1 + 1.4).toFixed(1),
    value: Math.round((idx * 0.1 + 1.4) * 10) / 10,
  };
});

export interface CustomizeStyleProps {
  className?: string;
  styleConfig?: CustomizeStyle;
}

export const CustomizeStyle = (props: CustomizeStyleProps) => {
  const {
    className,
    styleConfig = {
      typeface: "",
      font_size: 12,
      line_height: 1.4,
      line_width: 1,
    },
  } = props;
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));
  const [cfg, setCfg] = useState({
    ...styleConfig,
  });

  function handleCustomizeStyleChange(
    key: keyof CustomizeStyle,
    value: number | string | number[]
  ) {
    setCfg({
      ...cfg,
      [key]: value,
    });

    store.updateUserConfig({
      ...store.userConfig,
      customize_style: {
        ...cfg,
        [key]: value,
      },
    });

    document.documentElement.style.setProperty(
      `--reading-editable-${key.replace(/_/gi, "-")}`,
      value as string
    );
  }

  function handleThemeChange(value: string) {
    store.updateUserConfig({
      ...store.userConfig,
      theme: value,
    });

    console.log("🚀 ~ file: Theme.tsx:26 ~ handleThemeChange ~ value:", value);

    if (value === "system") {
      document.documentElement.dataset.colorScheme = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
        ? "dark"
        : "light";
    } else {
      document.documentElement.dataset.colorScheme = value;
    }
  }

  return (
    <div className={`w-full max-w-xs bg-detail-bg grid gap-4 ${className}`}>
      <div>
        <h5 className="text-sm mb-2">System theme</h5>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div
              className={clsx(
                "border rounded-lg h-14 flex cursor-pointer items-center justify-center dark:bg-foreground dark:text-background",
                {
                  "ring-2": store.userConfig.theme === "light",
                }
              )}
              onClick={() => handleThemeChange("light")}
            >
              <Sun size={20} />
            </div>
            <div className="mt-1 text-center text-sm">Light</div>
          </div>
          <div>
            <div
              className={clsx(
                "border rounded-lg h-14 flex cursor-pointer items-center justify-center",
                "bg-foreground text-background",
                "dark:bg-background dark:text-foreground",
                {
                  "ring-2": store.userConfig.theme === "dark",
                }
              )}
              onClick={() => handleThemeChange("dark")}
            >
              <Moon size={20} />
            </div>
            <div className="mt-1 text-center text-sm">Dark</div>
          </div>
          <div>
            <div
              className={clsx(
                "border rounded-lg h-14 cursor-pointer",
                "bg-gradient-to-br from-background from-50%  via-foreground via-0% to-foreground",
                "dark:from-foreground dark:from-50% dark:via-background dark:via-0% dark:to-background",
                {
                  "ring-2": store.userConfig.theme === "system",
                }
              )}
              onClick={() => handleThemeChange("system")}
            >
              <div className="h-full flex items-center justify-center gap-2 ">
                <span className="text-background dark:text-foreground mix-blend-difference contrast">
                  <Sun size={20} />
                </span>
                <span className="text-background dark:text-foreground">
                  <Moon size={19} />
                </span>
              </div>
            </div>
            <div className="mt-1 text-center text-sm">Auto</div>
          </div>
        </div>
      </div>
      <div>
        <h5 className="text-sm mb-2">Text styles</h5>
        <div className="border border-input rounded-md">
          {/* <div className="flex justify-between pl-3 border-t -mt-[1px] h-10">
            <Type size={20} strokeWidth={1.5} />
            <span>Typeface</span>
            <span>asdfsadf</span>
          </div> */}
          <ValueStep
            value={cfg.font_size}
            Icon={() => <CaseSensitive />}
            label="Font size"
            options={FONTSIZE_OPTIONS}
            onChange={(option) => {
              handleCustomizeStyleChange("font_size", option.value);
            }}
          />
          <div className="w-full h-[1px] bg-input" />
          <ValueStep
            value={cfg.line_height}
            Icon={() => <Baseline />}
            label="Line spacing"
            options={LINE_SPACING_OPTIONS}
            onChange={(option) => {
              handleCustomizeStyleChange("line_height", option.value);
            }}
          />
        </div>
      </div>
    </div>
  );
};
