import { useBearStore } from "@/stores";
import { Tooltip } from "@radix-ui/themes";
import clsx from "clsx";
import i18next from "i18next";
import { useState } from "react";

export interface Accent {
  name: string;
  variable: string;
}

export const AccentItem = (props: {
  name: string;
  variable: string;
  active: boolean;
  onClick: (accent: Accent) => void;
}) => {
  const { variable, name, active, onClick } = props;
  const bgColor = `bg-[${variable}]/50`

  return (
    <div onClick={() => onClick({ name, variable })}>
      <Tooltip content={i18next.t(name)}>
        <div
          className={clsx("w-7 h-7 rounded-full flex items-center justify-center", "border-2", {
            "shadow-[inset_0px_0px_0_2px_white]": active,
          })}
          style={{ backgroundColor: `${variable}`, borderColor: `${variable}` }}
        >
          <div
            className={clsx("w-2 h-2 rounded-full")}
            style={{ backgroundColor: active ? `var(--${name}-3)` : `var(--${name}-8)`}}
          ></div>
        </div>
      </Tooltip>
    </div>
  );
};

const ACCENTS = [
  "default",
  "brown",
  "ruby",
  "crimson",
  "pink",
  "purple",
  "violet",
  "iris",
  "indigo",
  "teal",
  "jade",
].map((name: string) => ({
  name,
  variable: `var(--${name}-9)`,
}));

export const Accent = () => {
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));
  const [currentTheme, setCurrentTheme] = useState(store.userConfig.theme);
  const handleClick = (accent: { name: string; variable: string }) => {
    const { name, variable } = accent;

    document.documentElement.style.setProperty(`--primary`, variable as string);
    document.documentElement.dataset.accent = name;

    store.updateUserConfig({
      ...store.userConfig,
      theme: name,
    });

    setCurrentTheme(name);
  };

  return (
    <div className="flex gap-4 items-center flex-wrap">
      {ACCENTS.map((accent: { name: string; variable: string }, i) => {
        return <AccentItem {...accent} active={accent.name === currentTheme} onClick={handleClick} key={i} />;
      })}
    </div>
  );
};
