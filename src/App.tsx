import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { appWindow } from "@tauri-apps/api/window";
import { emit, listen } from "@tauri-apps/api/event";
import { useBearStore } from "@/stores";
import { CommandPanel } from "./command";
import { LocalPage } from "./layout/Local";
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";

function App() {
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    getUserConfig: state.getUserConfig,
    updateSettingDialogStatus: state.updateSettingDialogStatus,
  }));

  useEffect(() => {
    listen("go-to-settings", () => {
      store.updateSettingDialogStatus(true);
    });

    listen("check_for_updates", async (e) => {
      emit("tauri://update");
    });
  }, []);

  useEffect(() => {
    document.getElementById("titlebar-minimize")?.addEventListener("click", () => appWindow.minimize());
    document.getElementById("titlebar-maximize")?.addEventListener("click", () => appWindow.toggleMaximize());
    document.getElementById("titlebar-close")?.addEventListener("click", () => appWindow.close());
  }, []);

  useEffect(() => {
    store.getUserConfig().then((cfg: UserConfig) => {
      const { color_scheme, customize_style } = cfg;
      let mode = color_scheme || "light";

      if (color_scheme === "system") {
        mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }

      if (mode === "dark") {
        document.body.classList.add("dark-theme");
      } else {
        document.body.classList.remove("dark-theme");
      }

      customize_style &&
        Object.keys(customize_style).length &&
        Object.keys(customize_style).forEach((key: string) => {
          document.documentElement.style.setProperty(
            `--reading-editable-${key.replace(/_/gi, "-")}`,
            customize_style[key as keyof CustomizeStyle] as string
          );
        });
    });
  }, []);

  return (
    <Theme
      className="w-[100vw] h-[100vh]"
      // @ts-ignore
      accentColor={store.userConfig.theme || "indigo"}
      panelBackground="translucent"
    >
      <div className="h-full max-h-full ">
        <LocalPage />
      </div>
      <CommandPanel />
      <Toaster />
    </Theme>
  );
}

export default App;
