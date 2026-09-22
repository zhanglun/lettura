import { useEffect, useMemo, useRef } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit, listen } from "@tauri-apps/api/event";
import { useBearStore } from "@/stores";
import { Theme } from "@radix-ui/themes";
import { DialogAboutApp } from "./components/About";
import { useShallow } from "zustand/react/shallow";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { showErrorToast } from "@/helpers/errorHandler";
import { useNavigate } from "react-router-dom";
import { RouteConfig } from "./config";
import { AppLayout } from "./components/layout/AppLayout";

function App() {
  const navigate = useNavigate();
  const store = useBearStore(
    useShallow((state) => ({
      userConfig: state.userConfig,
      getUserConfig: state.getUserConfig,
      updateAboutDialogStatus: state.updateAboutDialogStatus,
      updateAppMetadata: state.updateAppMetadata,
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
        navigate(RouteConfig.SETTINGS);
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
    navigate,
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
      });
    }
  }, []);

  return (
    <Theme
      className="w-[100vw] h-[100vh] "
      accentColor={accentColor}
      panelBackground="translucent"
    >
      <ErrorBoundary>
        <div className="h-full max-h-full ">
          <AppLayout />
        </div>
        <DialogAboutApp />
      </ErrorBoundary>
    </Theme>
  );
}

export default App;
