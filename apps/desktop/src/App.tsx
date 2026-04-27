import { useEffect, useCallback, useMemo, useRef } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit, listen } from "@tauri-apps/api/event";
import { useBearStore } from "@/stores";
import { LocalPage } from "./layout/Local";
import { Theme } from "@radix-ui/themes";
import { DialogAboutApp } from "./components/About";
import { OnboardingDialog } from "./components/Onboarding";
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
      setOnboardingOpen: state.setOnboardingOpen,
    })),
  );

  const accentColor = useMemo(() => {
    return store.userConfig.theme === "default" ||
      store.userConfig.theme === "custom"
      ? "indigo"
      : store.userConfig.theme || "indigo";
  }, [store.userConfig.theme]);

  useEffect(() => {
    if ((window as any).__TAURI_INTERNALS__) {
      const aboutUnsubscribe = listen("about_lettura", ({
        payload,
      }: {
        payload: string;
      }) => {
        store.updateAboutDialogStatus(true);
        try {
          store.updateAppMetadata(JSON.parse(payload));
        } catch (err) {
          showErrorToast(err, "Failed to parse app metadata");
        }
      });

      const settingsUnsubscribe = listen("go_to_settings", () => {
        store.updateSettingDialogStatus(true);
      });

      const updateUnsubscribe = listen("check_for_updates", async () => {
        emit("tauri://update");
      });

      return () => {
        aboutUnsubscribe.then((unsub) => unsub());
        settingsUnsubscribe.then((unsub) => unsub());
        updateUnsubscribe.then((unsub) => unsub());
      };
    }
  }, [
    store.updateAboutDialogStatus,
    store.updateAppMetadata,
    store.updateSettingDialogStatus,
  ]);

  useEffect(() => {
    const minBtn = document.getElementById("titlebar-minimize");
    const maxBtn = document.getElementById("titlebar-maximize");
    const closeBtn = document.getElementById("titlebar-close");

    const handleMinimize = () => getCurrentWebviewWindow().minimize();
    const handleMaximize = () => getCurrentWebviewWindow().toggleMaximize();
    const handleClose = () => getCurrentWebviewWindow().close();

    minBtn?.addEventListener("click", handleMinimize);
    maxBtn?.addEventListener("click", handleMaximize);
    closeBtn?.addEventListener("click", handleClose);

    return () => {
      minBtn?.removeEventListener("click", handleMinimize);
      maxBtn?.removeEventListener("click", handleMaximize);
      closeBtn?.removeEventListener("click", handleClose);
    };
  }, []);

  const hasFetchedConfig = useRef(false);
  const getUserConfigRef = useRef(store.getUserConfig);

  getUserConfigRef.current = store.getUserConfig;

  useEffect(() => {
    if (!hasFetchedConfig.current) {
      hasFetchedConfig.current = true;
      console.log("app render");
      getUserConfigRef.current().then((cfg: UserConfig) => {
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

        const appConfig = (cfg as any).app as { onboarding_completed?: boolean } | undefined;
        if (appConfig && !appConfig.onboarding_completed) {
          store.setOnboardingOpen(true);
        }
      });
    }
  }, []);

  return (
    <Theme
      className="w-[100vw] h-[100vh] "
      accentColor={accentColor}
      panelBackground="translucent"
    >
      <Toaster />
      <ErrorBoundary>
        <div className="h-full max-h-full ">
          <LocalPage />
        </div>
        <DialogAboutApp />
        <OnboardingDialog />
      </ErrorBoundary>
    </Theme>
  );
}

export default App;
