import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { appWindow } from "@tauri-apps/api/window";
import { emit, listen } from "@tauri-apps/api/event";
import { useBearStore } from "@/stores";
import { CommandPanel } from "./command";

import "./styles/index.css";

function App() {
  const store = useBearStore((state) => ({
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
    document
      .getElementById("titlebar-minimize")
      ?.addEventListener("click", () => appWindow.minimize());
    document
      .getElementById("titlebar-maximize")
      ?.addEventListener("click", () => appWindow.toggleMaximize());
    document
      .getElementById("titlebar-close")
      ?.addEventListener("click", () => appWindow.close());
  }, []);

  useEffect(() => {
    store.getUserConfig().then((cfg: UserConfig) => {
      const { color_scheme, customize_style } = cfg;

      if (color_scheme === "system") {
        document.documentElement.dataset.colorScheme = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches
          ? "dark"
          : "light";
      } else {
        document.documentElement.dataset.colorScheme = color_scheme;
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
    <>
      <div className="h-full max-h-full ">
        <Outlet />
      </div>
      <CommandPanel />
    </>
  );
}

export default App;
