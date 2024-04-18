import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useBearStore } from "@/stores";

export const ColorScheme = () => {
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));
  function handleThemeChange(value: string) {
    store.updateUserConfig({
      ...store.userConfig,
      color_scheme: value,
    });

    if (value === "system") {
      document.documentElement.dataset.colorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      document.documentElement.dataset.colorScheme = value;
    }
  }
  return (
    <div className="grid grid-cols-3 gap-4 w-[400px] transform-gpu">
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
  );
};
