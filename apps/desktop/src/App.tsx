import { Theme as AstryxTheme } from "@astryxdesign/core/theme";
import { emit, listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { busChannel } from "@/helpers/busChannel";
import { showErrorToast } from "@/helpers/errorHandler";
import { useAppStore } from "@/stores";
import { getAstryxTheme } from "@/themes";
import { DialogAboutApp } from "./components/About";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppLayout } from "./components/layout/AppLayout";
import { RouteConfig } from "./config";

function App() {
  const navigate = useNavigate();
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const store = useAppStore(
    useShallow((state) => ({
      userConfig: state.userConfig,
      getUserConfig: state.getUserConfig,
      updateAboutDialogStatus: state.updateAboutDialogStatus,
      updateAppMetadata: state.updateAppMetadata,
    })),
  );

  useEffect(() => {
    if ((window as any).__TAURI_INTERNALS__) {
      const aboutUnsubscribe = listen(
        "about_lettura",
        ({ payload }: { payload: string }) => {
          store.updateAboutDialogStatus(true);
          try {
            store.updateAppMetadata(JSON.parse(payload));
          } catch (err) {
            showErrorToast(err, "Failed to parse app metadata");
          }
        },
      );

      const settingsUnsubscribe = listen("go_to_settings", () => {
        navigate(RouteConfig.SETTINGS);
      });

      const updateUnsubscribe = listen("check_for_updates", async () => {
        emit("tauri://update");
      });

      // 后台 worker 单源同步完成 → 刷新订阅树与未读数。
      // 首次打通后端事件推送；payload 为 {uuid, title, inserted, error}。
      const syncCompletedUnsubscribe = listen("sync://completed", () => {
        busChannel.emit("getChannels");
      });

      return () => {
        aboutUnsubscribe.then((unsub) => unsub());
        settingsUnsubscribe.then((unsub) => unsub());
        updateUnsubscribe.then((unsub) => unsub());
        syncCompletedUnsubscribe.then((unsub) => unsub());
      };
    }
  }, [store.updateAboutDialogStatus, store.updateAppMetadata, navigate]);

  const hasFetchedConfig = useRef(false);
  const getUserConfigRef = useRef(store.getUserConfig);

  // ref 经 effect 同步（渲染期写 ref 会让编译器 bail-out）
  useEffect(() => {
    getUserConfigRef.current = store.getUserConfig;
  });

  // 夜读本：单一真源 = userConfig.color_scheme，body class 与 Astryx mode 均由它派生；
  // gothic 为永久深色主题（其 accent 假定深底），选中即强制深色
  const scheme = store.userConfig.color_scheme;
  const isDark =
    store.userConfig.astryx_theme === "gothic" ||
    scheme === "dark" ||
    ((scheme === "system" || !scheme) && systemDark);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", isDark);
  }, [isDark]);

  useEffect(() => {
    if (!hasFetchedConfig.current) {
      hasFetchedConfig.current = true;
      getUserConfigRef.current().then((cfg: UserConfig) => {
        // 列表密度：内容高对表 DESIGN 步距表（文章行 52+2，紧凑 44+2）
        document.documentElement.style.setProperty(
          "--row-h",
          cfg.card_density === "compact" ? "44px" : "52px",
        );
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
    <AstryxTheme
      theme={getAstryxTheme(store.userConfig.astryx_theme)}
      mode={isDark ? "dark" : "light"}
    >
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
