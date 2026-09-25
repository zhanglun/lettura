import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Upload } from "lucide-react";
import { Button } from "@astryxdesign/core/Button";
import { toast } from "@/helpers/toast";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import * as dataAgent from "@/helpers/dataAgent";
import { showErrorToast } from "@/helpers/errorHandler";
import { busChannel } from "@/helpers/busChannel";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { RouteConfig } from "@/config";
import pLimit from "p-limit";

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
            onClick={() => {
              store.initCollectionMetas();
              navigate(RouteConfig.LOCAL_ALL);
            }}
          />
          <Button variant="ghost" size="sm" label={t("fusion.nav.starred")} onClick={() => navigate(RouteConfig.LOCAL_STARRED)} />
          <Button variant="ghost" size="sm" label={t("fusion.cmd.add_feed")} onClick={() => store.setAddFeedModalOpen(true)} />
        </div>
      </div>
    );
  }

  return (
    <FirstRunFace
      onSubscribed={() => {
        store.getSubscribes();
        store.initCollectionMetas();
      }}
      onAddClick={() => store.setAddFeedModalOpen(true)}
    />
  );
}

function FirstRunFace({
  onSubscribed,
  onAddClick,
}: {
  onSubscribed: () => void;
  onAddClick: () => void;
}) {
  const { t } = useTranslation();
  const [pack, setPack] = useState<dataAgent.PackPreview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    dataAgent
      .previewPack("ai")
      .then((p) => setPack(p))
      .catch(() => {});
  }, []);

  const sources = useMemo(() => pack?.sources ?? [], [pack]);

  const toggle = (url: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const handleImportOpml = async () => {
    const selected = await openDialog({
      multiple: false,
      filters: [{ name: "OPML", extensions: ["opml", "xml"] }],
    });
    if (selected && typeof selected === "string") {
      try {
        const content = await readTextFile(selected);
        const result = await dataAgent.importOpml(content);
        busChannel.emit("getChannels");
        onSubscribed();
        if (result.feed_count > 0) {
          toast.success(
            t("Successfully imported {count} feeds", { count: result.feed_count }),
          );
        }
      } catch (error) {
        showErrorToast(error, t("Failed to import OPML file"));
      }
    }
  };

  const subscribeSelected = async () => {
    if (selected.size === 0 || subscribing) return;
    setSubscribing(true);
    const limit = pLimit(3);
    const urls = [...selected];
    const jobs = urls.map((url) =>
      limit(() => dataAgent.subscribeFeed(url).catch(() => null)),
    );
    await Promise.all(jobs);
    busChannel.emit("getChannels");
    onSubscribed();
    toast.success(t("fusion.empty.subscribed", { count: urls.length }));
    setSubscribing(false);
  };

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
          onClick={onAddClick}
        />
        <Button
          variant="ghost"
          size="sm"
          icon={<Upload size={13} />}
          label={t("fusion.empty.import_opml")}
          onClick={handleImportOpml}
        />
      </div>

      {sources.length > 0 && (
        <div className="fusion-pack">
          <div className="pk-h">
            <span className="pk-t">
              {t("fusion.empty.pack_title", { name: pack?.name ?? "" })}
            </span>
            <span className="pk-count">
              {t("fusion.empty.pack_count", {
                selected: selected.size,
                total: sources.length,
              })}
            </span>
          </div>
          <p className="pk-d">{pack?.description}</p>
          <div className="pk-list">
            {sources.slice(0, 6).map((src) => {
              const on = selected.has(src.feed_url);
              return (
                <button
                  type="button"
                  key={src.feed_url}
                  className={`pk-row ${on ? "on" : ""}`}
                  onClick={() => toggle(src.feed_url)}
                >
                  <span className="cb">
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <path d="m3.5 8.5 3 3 6-6.5" />
                    </svg>
                  </span>
                  <span className="pk-n">{src.title}</span>
                  <span className="pk-h2">
                    {src.site_url?.replace(/^https?:\/\//, "") ?? ""}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="pk-foot">
            <button
              type="button"
              className="pk-all"
              onClick={() =>
                setSelected((prev) =>
                  prev.size === Math.min(6, sources.length)
                    ? new Set()
                    : new Set(sources.slice(0, 6).map((s) => s.feed_url)),
                )
              }
            >
              {selected.size > 0 ? t("fusion.empty.unselect_all") : t("fusion.empty.select_all")}
            </button>
            <button
              type="button"
              className={`pk-sub ${selected.size > 0 ? "ready" : ""}`}
              disabled={selected.size === 0 || subscribing}
              onClick={subscribeSelected}
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
                <path d="m3.5 8.5 3 3 6-6.5" />
              </svg>
              {selected.size > 0
                ? t("fusion.empty.subscribe_n", { count: selected.size })
                : t("fusion.empty.subscribe_selected")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
