import { useEffect, useRef, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { useBearStore } from "@/stores";
import { Theme as AstryxTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { DialogAboutApp } from "./components/About";
import { useShallow } from "zustand/react/shallow";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { showErrorToast } from "@/helpers/errorHandler";
import { applyAccent } from "@/helpers/accent";
import { useNavigate } from "react-router-dom";
import { RouteConfig } from "./config";
import { AppLayout } from "./components/layout/AppLayout";

function App() {
  const navigate = useNavigate();
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const store = useBearStore(
    useShallow((state) => ({
      userConfig: state.userConfig,
      getUserConfig: state.getUserConfig,
      updateAboutDialogStatus: state.updateAboutDialogStatus,
      updateAppMetadata: state.updateAppMetadata,
    })),
  );

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

  // 夜读本：单一真源 = userConfig.color_scheme，body class 与 Astryx mode 均由它派生
  const scheme = store.userConfig.color_scheme;
  const isDark =
    scheme === "dark" || ((scheme === "system" || !scheme) && systemDark);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", isDark);
  }, [isDark]);

  useEffect(() => {
    if (!hasFetchedConfig.current) {
      hasFetchedConfig.current = true;
      getUserConfigRef.current().then((cfg: UserConfig) => {
        const { customize_style } = cfg;

        // 强调色（userConfig 单源；令牌层 color-mix 派生）/ 列表密度
        applyAccent(cfg.accent_color);
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
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <AstryxTheme theme={neutralTheme} mode={isDark ? "dark" : "light"}>
      <div className="w-[100vw] h-[100vh]">
        <ErrorBoundary>
          <div className="h-full max-h-full ">
            <AppLayout />
          </div>
          <DialogAboutApp />
        </ErrorBoundary>
      </div>
    </AstryxTheme>
  );
}

export default App;
