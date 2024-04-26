import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBearStore } from "@/stores";
import clsx from "clsx";
import { useState } from "react";

export interface Accent {
  name: string;
  hsl: string;
}

export const AccentItem = (props: {
  name: string;
  hsl: string;
  active: boolean;
  onClick: (accent: Accent) => void;
}) => {
  const { hsl, name, active, onClick } = props;

  return (
    <div onClick={() => onClick({ name, hsl })}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div
              className={clsx("w-10 h-10 rounded-full flex items-center justify-center", "border-2", {
                "shadow-[inset_0px_0px_0_2px_white]": active,
              })}
              style={{ backgroundColor: `hsl(${hsl})`, borderColor: `hsl(${hsl})` }}
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
      name: "black",
      hsl: "0 0% 13%",
    },
    {
      name: "luckin",
      hsl: "214 100% 18%",
    },
    {
      name: "starbucks",
      hsl: "160 100% 22%",
    },
    {
      name: "tims",
      hsl: "350 85% 42%",
    },
  ];

  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));
  const [currentTheme, setCurrentTheme] = useState(store.userConfig.theme);
  const handleClick = (accent: { name: string; hsl: string }) => {
    const { name, hsl } = accent;

    document.documentElement.style.setProperty(`--primary`, hsl as string);
    store.updateUserConfig({
      ...store.userConfig,
      theme: name,
    });

    setCurrentTheme(name);
  };

  return (
    <div className="flex gap-4 items-center">
      {ACCENTS.map((accent: { name: string; hsl: string }, i) => {
        return <AccentItem {...accent} active={accent.name === currentTheme} onClick={handleClick} key={i} />;
      })}
    </div>
  );
};
