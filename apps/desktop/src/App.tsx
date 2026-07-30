import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { emit, listen } from "@tauri-apps/api/event";
import { useBearStore } from "@/stores";
import { LocalPage } from "./layout/Local";
import { Theme } from "@radix-ui/themes";
import { DialogAboutApp } from "./components/About";
import { OnboardingDialog } from "./components/Onboarding";
import { useShallow } from "zustand/react/shallow";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { showErrorToast } from "@/helpers/errorHandler";
import { useNavigate } from "react-router-dom";
import { RouteConfig } from "./config";

function App() {
  const navigate = useNavigate();
  const store = useBearStore(
    useShallow((state) => ({
      userConfig: state.userConfig,
      getUserConfig: state.getUserConfig,
      updateAboutDialogStatus: state.updateAboutDialogStatus,
      updateAppMetadata: state.updateAppMetadata,
      setOnboardingOpen: state.setOnboardingOpen,
      setPipelineStatus: state.setPipelineStatus,
      setPipelineProgress: state.setPipelineProgress,
      setPipelineError: state.setPipelineError,
    })),
  );

  const accentColor = useMemo(() => {
    return store.userConfig.theme === "default" ||
      store.userConfig.theme === "custom"
      ? "indigo"
      : store.userConfig.theme || "indigo";
  }, [store.userConfig.theme]);
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const resolvedAppearance = useMemo<"light" | "dark">(() => {
    const colorScheme = store.userConfig.color_scheme || "light";

    if (colorScheme === "system") {
      return systemPrefersDark ? "dark" : "light";
    }

    return colorScheme === "dark" ? "dark" : "light";
  }, [store.userConfig.color_scheme, systemPrefersDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    setSystemPrefersDark(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    const isDark = resolvedAppearance === "dark";
    document.body.classList.toggle("dark-theme", isDark);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.dataset.colorScheme = resolvedAppearance;
  }, [resolvedAppearance]);

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
    if (!(window as any).__TAURI_INTERNALS__) return;

    const unsubs: (() => void)[] = [];
    let cancelled = false;

    import("@tauri-apps/api/event").then(async ({ listen }) => {
      if (cancelled) return;

      unsubs.push(
        await listen("pipeline:started", () => {
          store.setPipelineStatus("running");
        }),
      );
      unsubs.push(
        await listen("pipeline:progress", (e: any) => {
          const { stage, current, total } = e.payload;
          store.setPipelineProgress(stage, current, total);
        }),
      );
      unsubs.push(
        await listen("pipeline:completed", () => {
          store.setPipelineStatus("done");
        }),
      );
      unsubs.push(
        await listen("pipeline:failed", (e: any) => {
          const msg = e.payload?.error_message || "Unknown error";
          store.setPipelineError(msg);
        }),
      );

      const { invoke } = await import("@tauri-apps/api/core");
      const running = await invoke<boolean>("is_pipeline_running");
      if (!cancelled && running) {
        store.setPipelineStatus("running");
      }
    });

    return () => {
      cancelled = true;
      unsubs.forEach((unsub) => unsub());
    };
  }, [store.setPipelineStatus, store.setPipelineProgress, store.setPipelineError]);

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
      appearance={resolvedAppearance}
      panelBackground="translucent"
    >
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
