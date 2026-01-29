import { useEffect, useCallback } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { emit, listen } from "@tauri-apps/api/event";
import { useBearStore } from "@/stores";
import { LocalPage } from "./layout/Local";
import { Theme } from "@radix-ui/themes";
import { DialogAboutApp } from "./components/About";
import { useShallow } from "zustand/react/shallow";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { showErrorToast } from "@/helpers/errorHandler";

function App() {
  const store = useBearStore(
    useShallow((state) => ({
      userConfig: state.userConfig,
      getUserConfig: state.getUserConfig,
      updateSettingDialogStatus: state.updateSettingDialogStatus,
      updateAboutDialogStatus: state.updateAboutDialogStatus,
      updateAppMetadata: state.updateAppMetadata,
    })),
  );

  useEffect(() => {
    if (window.__TAURI_IPC__ as any) {
      listen("about_lettura", ({ payload }: { payload: string }) => {
        store.updateAboutDialogStatus(true);
        try {
          store.updateAppMetadata(JSON.parse(payload));
        } catch (err) {
          showErrorToast(err, "Failed to parse app metadata");
        }
      });

      listen("go_to_settings", () => {
        store.updateSettingDialogStatus(true);
      });

      listen("check_for_updates", async () => {
        emit("tauri://update");
      });
    }
  }, [
    store.updateAboutDialogStatus,
    store.updateAppMetadata,
    store.updateSettingDialogStatus,
  ]);

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
    console.log("app render");
    store.getUserConfig().then((cfg: UserConfig) => {
      const { color_scheme, customize_style } = cfg;
      let mode = color_scheme || "light";

      if (color_scheme === "system") {
        mode = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }

      if (mode === "dark") {
        document.body.classList.add("dark-theme");
      } else {
        document.body.classList.remove("dark-theme");
      }

      if (customize_style && Object.keys(customize_style).length) {
        for (const key of Object.keys(customize_style)) {
          document.documentElement.style.setProperty(
            `--reading-editable-${key.replace(/_/gi, "-")}`,
            customize_style[key as keyof CustomizeStyle] as string,
          );
        }
      }
    });
  }, [store.getUserConfig]);

  return (
    <Theme
      className="w-[100vw] h-[100vh] "
      accentColor={
        store.userConfig.theme === "default" ||
        store.userConfig.theme === "custom"
          ? "indigo"
          : store.userConfig.theme || "indigo"
      }
      panelBackground="translucent"
    >
      <Toaster />
      <ErrorBoundary>
        <div className="h-full max-h-full ">
          <LocalPage />
        </div>
        <DialogAboutApp />
      </ErrorBoundary>
    </Theme>
  );
}

export default App;
