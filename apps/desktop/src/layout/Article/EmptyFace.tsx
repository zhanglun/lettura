import { Button } from "@astryxdesign/core/Button";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { Plus, Upload } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import { busChannel } from "@/helpers/busChannel";
import { invoke } from "@tauri-apps/api/core";
import { showErrorToast } from "@/helpers/errorHandler";
import { toast } from "@/helpers/toast";
import { useBearStore } from "@/stores";

/** 预览开关：置 true 强制走「零订阅」首启分支（查看新用户首屏），平时保持 false */
export const DEV_PREVIEW_FIRST_RUN = false;

/** 空状态即引导（empty.html 契约）：零订阅 = 产品自我介绍，零未读 = 读完就走的收尾 */
export function EmptyFace({ mode }: { mode: "first" | "clear" }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const store = useBearStore(
    useShallow((state) => ({
      setAddFeedModalOpen: state.setAddFeedModalOpen,
      getSubscribes: state.getSubscribes,
      initCollectionMetas: state.initCollectionMetas,
    })),
  );

  const importOpml = async () => {
    const selected = await openDialog({
      multiple: false,
      filters: [{ name: "OPML", extensions: ["opml", "xml"] }],
    });
    if (selected && typeof selected === "string") {
      try {
        const content = await readTextFile(selected);
        const result = await invoke<{
          feed_count: number;
        }>("import_opml", { opmlContent: content });
        busChannel.emit("getChannels");
        store.getSubscribes();
        store.initCollectionMetas();
        if (result.feed_count > 0) {
          toast.success(
            t("Successfully imported {count} feeds", {
              count: result.feed_count,
            }),
          );
        }
      } catch (error) {
        showErrorToast(error, t("Failed to import OPML file"));
      }
    }
  };

  if (mode === "clear") {
    return (
      <div className="fusion-face">
        <span className="fusion-mark quiet">
          <i />
        </span>
        <h1>{t("fusion.empty.clear_title")}</h1>
        <p className="lede">{t("fusion.empty.clear_lede")}</p>
        <div className="fusion-quietline">
          <Button
            variant="ghost"
            size="sm"
            label={t("fusion.nav.history")}
            onClick={() => navigate(RouteConfig.LOCAL_ALL)}
          />
          <Button
            variant="ghost"
            size="sm"
            label={t("fusion.nav.starred")}
            onClick={() => navigate(RouteConfig.LOCAL_STARRED)}
          />
          <Button
            variant="ghost"
            size="sm"
            label={t("fusion.cmd.add_feed")}
            onClick={() => store.setAddFeedModalOpen(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fusion-face">
      <span className="fusion-mark">
        <i />
      </span>
      <h1>{t("fusion.empty.first_title")}</h1>
      <p className="lede">{t("fusion.empty.first_lede")}</p>
      <div className="fusion-cta">
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={13} />}
          label={t("fusion.cmd.add_feed")}
          onClick={() => store.setAddFeedModalOpen(true)}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={<Upload size={13} />}
          label={t("fusion.empty.import_opml")}
          onClick={importOpml}
        />
      </div>
    </div>
  );
}
