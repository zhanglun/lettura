import React, { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { useBearStore } from "../../../hooks/useBearStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CustomizeStyleProps {
  className?: string;
  styleConfig: CustomizeStyle | undefined;
}

export const CustomizeStyle = (props: CustomizeStyleProps) => {
  const { className, styleConfig } = props;
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));
  const [cfg, setCfg] = useState({
    typeface: "",
    font_size: 12,
    line_height: 28,
    line_width: 1,
  });

  useEffect(() => {
    styleConfig && setCfg({ ...styleConfig });
  }, [styleConfig]);

  function handleCustomizeStyleChange(
    key: keyof CustomizeStyle,
    value: number | string | number[],
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
      value as string,
    );
  }

  return (
    <div className={`w-full max-w-xs bg-detail-bg grid gap-4 ${className}`}>
      <div className="grid gap-2 grid-flow-col grid-cols-[74px_auto_42px] items-center">
        <div className="text-sm">Typeface</div>
        <div>
          <Select
            value={cfg.typeface.toString()}
            onValueChange={(v: string) =>
              handleCustomizeStyleChange("typeface", v)
            }
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">System</SelectItem>
              <SelectItem value="STXingkai,KaiT,isans-serif">KaiTi</SelectItem>
              <SelectItem value="NSimSun,STSong,sans-serif">SongTi</SelectItem>
              <SelectItem value="Songti SC,STHeitiSimHei,sans-serif">
                HeiTi
              </SelectItem>
              <SelectItem value="Yuanti SC,sans-serif">Yuanti</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2 grid-flow-col grid-cols-[74px_auto_42px] items-center">
        <div className="text-sm">Font Size</div>
        <div>
          <Slider
            value={[cfg.font_size]}
            max={20}
            min={12}
            step={1}
            onValueChange={(value: number[]) => {
              handleCustomizeStyleChange("font_size", value[0]);
            }}
          />
        </div>
        <div className="bg-foreground text-background rounded text-center text-xs py-[2px]">
          {cfg.font_size}
        </div>
      </div>
      <div className="grid gap-2 grid-flow-col grid-cols-[74px_auto_42px] items-center">
        <div className="text-sm">Line Height</div>
        <div>
          <Slider
            value={[cfg.line_height]}
            max={36}
            min={20}
            step={2}
            onValueChange={(value: number[]) =>
              handleCustomizeStyleChange("line_height", value[0])
            }
          />
        </div>
        <div className="bg-foreground text-background rounded text-center text-xs py-[2px]">
          {cfg.line_height}
        </div>
      </div>
      <div className="grid gap-2 grid-flow-col grid-cols-[74px_auto_42px] items-center">
        <div className="text-sm">Line Width</div>
        <div>
          <Slider
            value={[cfg.line_width]}
            max={5}
            min={1}
            step={1}
            onValueChange={(value: number[]) =>
              handleCustomizeStyleChange("line_width", value[0])
            }
          />
        </div>
        <div className="bg-foreground text-background rounded text-center text-xs py-[2px]">
          {cfg.line_width}
        </div>
      </div>
    </div>
  );
};
