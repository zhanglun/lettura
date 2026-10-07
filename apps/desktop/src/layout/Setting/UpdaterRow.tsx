import { Button } from "@astryxdesign/core/Button";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { showErrorToast } from "@/helpers/errorHandler";
import { toast } from "@/helpers/toast";
import { SRow } from "./index";

/**
 * 设置页「检查更新」行：手动检查 → 展示新版本 → 下载安装 → 重启生效。
 * 更新产物由发布流水线签名（createUpdaterArtifacts），插件侧做公钥校验；
 * 自动检查刻意不做（读完就走，不打扰），入口只在这里。
 */
export function UpdaterRow() {
  const { t } = useTranslation();
  // idle → checking → available → downloading → ready；none = 已是最新（toast 后回 idle）
  const [stage, setStage] = useState<
    "idle" | "checking" | "available" | "downloading" | "ready"
  >("idle");
  const [update, setUpdate] = useState<Update | null>(null);

  const run = (fn: () => Promise<void>) => {
    fn().catch((error: unknown) => {
      showErrorToast(error, t("settings.updater.failed"));
      setStage(update ? "available" : "idle");
    });
  };

  const handleCheck = () =>
    run(async () => {
      setStage("checking");
      const found = await check();
      if (found) {
        setUpdate(found);
        setStage("available");
      } else {
        toast.message(t("settings.updater.latest"));
        setStage("idle");
      }
    });

  const handleInstall = () =>
    run(async () => {
      if (!update) return;
      setStage("downloading");
      // 内容长度与进度刻意不展示：桌面应用的更新就是「点一下，等它好」
      await update.downloadAndInstall();
      setStage("ready");
    });

  const handleRestart = () => {
    void relaunch();
  };

  const label =
    stage === "checking"
      ? t("settings.updater.checking")
      : stage === "downloading"
        ? t("settings.updater.downloading")
        : stage === "available" && update
          ? t("settings.updater.download", { version: update.version })
          : stage === "ready"
            ? t("settings.updater.restart")
            : t("settings.updater.check");

  const busy = stage === "checking" || stage === "downloading";

  return (
    <SRow label={t("settings.updater.title")} help={t("settings.updater.help")}>
      <Button
        variant="secondary"
        size="sm"
        label={label}
        isLoading={busy}
        onClick={
          stage === "ready"
            ? handleRestart
            : stage === "available"
              ? handleInstall
              : handleCheck
        }
      />
    </SRow>
  );
}
