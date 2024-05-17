import { useState } from "react";
import { useBearStore } from "@/stores";
import { CaseSensitive, Baseline, AlignJustify } from "lucide-react";
import { ValueStep } from "./ValueStep";
import { Separator } from "@radix-ui/themes";

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

const PAGE_SIZE_OPTIONS = [
  { label: "X-Small", value: 504 },
  { label: "Small", value: 576 },
  { label: "Medium", value: 648 },
  { label: "Large", value: 720 },
  { label: "X-Large", value: 792 },
];

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

  function handleCustomizeStyleChange(key: keyof CustomizeStyle, value: number | string | number[]) {
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

    document.documentElement.style.setProperty(`--reading-editable-${key.replace(/_/gi, "-")}`, value as string);
  }

  return (
    <div className={`w-full max-w-xs grid gap-4 ${className}`}>
      <div className="border-1 rounded">
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
        <Separator size="4" />
        <ValueStep
          value={cfg.line_height}
          Icon={() => <Baseline />}
          label="Line spacing"
          options={LINE_SPACING_OPTIONS}
          onChange={(option) => {
            handleCustomizeStyleChange("line_height", option.value);
          }}
        />
        <Separator size="4" />
        <ValueStep
          value={cfg.line_width}
          Icon={() => <AlignJustify />}
          label="Line width"
          options={PAGE_SIZE_OPTIONS}
          onChange={(option) => {
            handleCustomizeStyleChange("line_width", option.value);
          }}
        />
      </div>
    </div>
  );
};
