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

    let mode = value || "light";

    if (value === 'system') {
      mode = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
        ? "dark"
        : "light";
    }

    if (mode === 'dark') {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }
  return (
    <div className="grid grid-cols-3 gap-4 w-[400px] transform-gpu">
      <div>
        <div
          className={clsx(
            "border-2 rounded-lg h-14 flex cursor-pointer items-center justify-center bg-white text-black dark:outline-none",
            {
              "border-[var(--accent-10)]": store.userConfig.color_scheme === "light",
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
            "border-2 border-black rounded-lg h-14 flex cursor-pointer items-center justify-center",
            "bg-black text-white",
            {
              "border-[var(--accent-10)]": store.userConfig.color_scheme === "dark",
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
            "border-2 rounded-lg h-14 cursor-pointer",
            "bg-gradient-to-br from-white from-50%  via-black via-0% to-black",
            "dark:from-foreground dark:from-50% dark:via-background dark:via-0% dark:to-background",
            {
              "border-[var(--accent-10)]": store.userConfig.color_scheme === "system",
            }
          )}
          onClick={() => handleThemeChange("system")}
        >
          <div className="h-full flex items-center justify-center gap-2 ">
            <span className="text-white mix-blend-difference constrast">
              <Sun size={20} />
            </span>
            <span className="text-white mix-blend-difference contrast">
              <Moon size={19} />
            </span>
          </div>
        </div>
        <div className="mt-1 text-center text-sm">Auto</div>
      </div>
    </div>
  );
};
