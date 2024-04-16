import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBearStore } from "@/stores";

export const AccentItem = (props: { name: string; hsl: string }) => {
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));
  const { hsl, name } = props;

  const handleClick = () => {
    document.documentElement.style.setProperty(
      `--primary`, hsl as string
    );
    store.updateUserConfig({
      ...store.userConfig,
      theme: name,
    });
  }

  return (
    <div onClick={handleClick}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: `hsl(${hsl})` }}></div>
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

  return (
    <div className="flex items-center gap-4">
      {ACCENTS.map((accent: { name: string; hsl: string }) => {
        return <AccentItem {...accent} />;
      })}
    </div>
  );
};
