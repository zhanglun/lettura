import { useEffect, useMemo, useRef, useState } from "react";
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
  const [isDark, setIsDark] = useState(false);
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

  const hasFetchedConfig = useRef(false);
  const getUserConfigRef = useRef(store.getUserConfig);

  getUserConfigRef.current = store.getUserConfig;

  useEffect(() => {
    if (!hasFetchedConfig.current) {
      hasFetchedConfig.current = true;
      getUserConfigRef.current().then((cfg: UserConfig) => {
        const { customize_style, color_scheme } = cfg;

        // 夜读本：跟随配置或系统（设置页切换即时生效）
        const mode =
          color_scheme === "system" || !color_scheme
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light"
            : color_scheme;
        document.body.classList.toggle("dark-theme", mode === "dark");
        setIsDark(mode === "dark");

        // 强调色 / 列表密度（localStorage）
        const accent = localStorage.getItem("fusion_accent");
        if (accent) {
          const hex = {
            indigo: "#5E6AD2",
            moss: "#3E8E6D",
            ochre: "#B06A3B",
            brick: "#C4564A",
            vine: "#8A6BB8",
          }[accent];
          if (hex) {
            document.documentElement.style.setProperty("--fusion-accent", hex);
            document.documentElement.style.setProperty("--fusion-accent-soft", hex + "1a");
          }
        }
        document.documentElement.style.setProperty(
          "--row-h",
          cfg.card_density === "compact" ? "44px" : "54px",
        );

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

  // 跟随系统时的实时切换
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      if (store.userConfig.color_scheme === "system" || !store.userConfig.color_scheme) {
        document.body.classList.toggle("dark-theme", e.matches);
        setIsDark(e.matches);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [store.userConfig.color_scheme]);

  return (
    <Theme
      className="w-[100vw] h-[100vh] "
      accentColor={accentColor}
      appearance={isDark ? "dark" : "light"}
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
