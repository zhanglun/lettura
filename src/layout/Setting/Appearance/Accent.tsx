import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBearStore } from "@/stores";
import clsx from "clsx";
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

  return (
    <div onClick={() => onClick({ name, variable })}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div
              className={clsx("w-10 h-10 rounded-full flex items-center justify-center", "border-2", {
                "shadow-[inset_0px_0px_0_2px_white]": active,
              })}
              style={{ backgroundColor: `${variable}`, borderColor: `${variable}` }}
            >
              <div
                className={clsx("w-3 h-3 rounded-full", {
                  "bg-white/50": !active,
                  "bg-white/90": active,
                })}
              ></div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export const Accent = () => {
  const ACCENTS = [
    {
      name: "ruby",
      variable: 'var(--ruby-10)',
    },
    {
      name: "indigo",
      variable: 'var(--indigo-10)',
    },
    {
      name: "tomato",
      variable: 'var(--tomato-10)',
    },
    {
      name: "iris",
      variable: 'var(--iris-10)',
    },
  ];

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
    <div className="flex gap-4 items-center">
      {ACCENTS.map((accent: { name: string; variable: string }, i) => {
        return <AccentItem {...accent} active={accent.name === currentTheme} onClick={handleClick} key={i} />;
      })}
    </div>
  );
};
