import { Plus, Minus, LucideProps } from "lucide-react";
import React, { useEffect, useState } from "react";

interface OptionItem {
  label: string; value: number | string
}

export interface ValueStepProps {
  Icon: React.ComponentType<LucideProps>;
  label: string;
  value: number | string;
  options: OptionItem[];
  onChange: (option: OptionItem) => any;
}

export const ValueStep = React.memo((props: ValueStepProps) => {
  const { Icon, label, value, options, onChange } = props;
  const [selected, setSelected] = useState<OptionItem>({
    label: "",
    value: 0,
  });
  const [point, setPoint] = useState<number>(0);

  function prev() {
    if (point <= 0) {
      return;
    }

    setPoint((p) => p - 1);
    setSelected(options[point - 1]);
    onChange(options[point - 1]);
  }

  function next() {
    if (point >= options.length - 1) {
      return;
    }

    setPoint((p) => p + 1);
    setSelected(options[point + 1]);
    onChange(options[point + 1]);
  }

  useEffect(() => {
    if (value && options.length > 0) {
      const idx = options.findIndex((_) => _.value === value);

      setSelected(options[Math.max(idx, 0)]);
      setPoint(Math.max(idx, 0));
    }
  }, [value]);

  return (
    <div className="flex justify-between pl-2 py-1 pr-1 h-10 select-none">
      <div className="flex items-center gap-3">
        <span className="text-slate-500">
          <Icon size={24} strokeWidth={1} />
        </span>
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs">{selected.label}</span>
        <div className="flex items-center gap-[2px]">
          <div
            className="bg-accent hover:bg-accent/80 cursor-pointer rounded-l-[4px] w-8 h-8 flex items-center justify-center"
            onClick={prev}
          >
            <Minus size={16} />
          </div>
          <div
            className="bg-accent hover:bg-accent/80 cursor-pointer rounded-r-[4px] w-8 h-8 flex items-center justify-center"
            onClick={next}
          >
            <Plus size={16} />
          </div>
        </div>
      </div>
    </div>
  );
});
