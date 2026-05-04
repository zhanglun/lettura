import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  Switch,
} from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { saveAIConfig, validateAIConfig, triggerPipeline, getDedupStats } from "@/helpers/dataAgent";
import { CheckCircle, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

export function AIConfigPanel() {
  const { t } = useTranslation();
  const store = useBearStore(
    useShallow((state) => ({
      aiConfig: state.aiConfig,
      fetchAIConfig: state.fetchAIConfig,
      pipelineStatus: state.pipelineStatus,
    })),
  );

  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [embeddingModel, setEmbeddingModel] = useState(
    "text-embedding-3-small",
  );
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [pipelineInterval, setPipelineInterval] = useState("6");
  const [enableEmbedding, setEnableEmbedding] = useState(true);
  const [backgroundSync, setBackgroundSync] = useState(
    () => store.aiConfig?.enable_auto_pipeline ?? true,
  );

  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [triggeringPipeline, setTriggeringPipeline] = useState(false);
  const [dedupStats, setDedupStats] = useState<{
    total_analyzed: number;
    duplicates_found: number;
    duplicate_groups: number;
    avg_information_density: number;
  } | null>(null);

  useEffect(() => {
    getDedupStats()
      .then(setDedupStats)
      .catch(() => {});
    if (store.aiConfig) {
      setModel(store.aiConfig.model || "gpt-4o-mini");
      setEmbeddingModel(store.aiConfig.embedding_model || "text-embedding-3-small");
      setBaseUrl(store.aiConfig.base_url || "https://api.openai.com/v1");
      setEnableEmbedding(store.aiConfig.enable_embedding ?? true);
      setPipelineInterval(String(store.aiConfig.pipeline_interval_hours || 6));
      setBackgroundSync(store.aiConfig.enable_auto_pipeline ?? true);
    }
  }, [store.aiConfig]);

  const handleValidate = useCallback(async () => {
    if (!apiKey.trim() && !store.aiConfig?.has_api_key) return;
    setValidating(true);
    setValidationResult(null);
    try {
      const result = await validateAIConfig();
      setValidationResult(result);
    } catch (e) {
      setValidationResult({ valid: false, message: String(e) });
    } finally {
      setValidating(false);
    }
  }, [apiKey, store.aiConfig?.has_api_key]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveAIConfig({
        apiKey,
        model,
        embeddingModel,
        baseUrl,
        pipelineIntervalHours: parseInt(pipelineInterval) || 1,
        enableEmbedding,
        enableAutoPipeline: backgroundSync,
      });
      toast.success(t("settings.ai.saved"));
      store.fetchAIConfig();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }, [apiKey, model, embeddingModel, baseUrl, pipelineInterval, enableEmbedding, store, t]);

  const handleTriggerPipeline = useCallback(async () => {
    setTriggeringPipeline(true);
    try {
      await triggerPipeline("manual");
      toast.success(t("settings.ai.pipeline_triggered"));
    } catch (e) {
      toast.error(String(e));
    } finally {
      setTriggeringPipeline(false);
    }
  }, [t]);

  return (
    <div className="settings-grid-wide">
      <div className="settings-panel">
        <div className="settings-panel-header">
          <div>
            <div className="settings-panel-title">{t("settings.ai.panel_title")}</div>
            <div className="settings-panel-desc">{t("settings.ai.panel_desc")}</div>
          </div>
          <button
            className="btn-primary"
            onClick={handleValidate}
            disabled={(!apiKey.trim() && !store.aiConfig?.has_api_key) || validating}
          >
            {validating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : validationResult?.valid ? (
              <CheckCircle size={14} />
            ) : null}
            {validating ? t("settings.ai.validating") : t("settings.ai.validate")}
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-row">
            <div>
              <div className="settings-label">{t("settings.ai.api_key")}</div>
              <div className="settings-help">{t("settings.ai.api_key_help")}</div>
            </div>
            <input
              type="password"
              className="settings-input"
              placeholder={
                store.aiConfig?.has_api_key
                  ? "••••••••••••••••"
                  : t("settings.ai.api_key_placeholder")
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button className="btn-ghost" onClick={() => setApiKey("")}>
              {t("settings.ai.change")}
            </button>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">{t("settings.ai.base_url")}</div>
              <div className="settings-help">{t("settings.ai.base_url_help")}</div>
            </div>
            <input
              className="settings-input"
              placeholder={t("settings.ai.base_url_placeholder")}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            <button className="btn-ghost" onClick={() => setBaseUrl("https://api.openai.com/v1")}>
              {t("settings.ai.reset")}
            </button>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">{t("settings.ai.model")}</div>
              <div className="settings-help">{t("settings.ai.model_help")}</div>
            </div>
            <Select.Root value={model} onValueChange={setModel}>
              <Select.Trigger className="settings-select" />
              <Select.Content>
                <Select.Item value="gpt-4o-mini">gpt-4o-mini</Select.Item>
                <Select.Item value="gpt-4.1-mini">gpt-4.1-mini</Select.Item>
              </Select.Content>
            </Select.Root>
            {validationResult?.valid && (
              <span className="settings-tag settings-tag--green">{t("settings.ai.connected")}</span>
            )}
            {!validationResult?.valid && validationResult && (
              <span className="settings-tag settings-tag--amber">{t("settings.ai.validation_failed")}</span>
            )}
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">{t("settings.ai.save_label")}</div>
              <div className="settings-help">{t("settings.ai.save_help")}</div>
            </div>
            <div />
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? t("settings.ai.saving") : t("settings.ai.save")}
            </button>
          </div>
        </div>

        <div className="settings-section">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="settings-label">{t("settings.ai.analysis_status")}</div>
            <span className="settings-tag settings-tag--accent">{t("settings.ai.last_analysis")}</span>
          </div>
          <div className="settings-kpi">
            <div className="card">
              <div className="settings-kpi-value">{dedupStats?.total_analyzed ?? 0}</div>
              <div className="settings-kpi-label">{t("settings.ai.kpi_sources")}</div>
            </div>
            <div className="card">
              <div className="settings-kpi-value">{dedupStats?.duplicates_found ?? 0}</div>
              <div className="settings-kpi-label">{t("settings.ai.kpi_articles")}</div>
            </div>
            <div className="card">
              <div className="settings-kpi-value">{dedupStats?.duplicate_groups ?? 0}</div>
              <div className="settings-kpi-label">{t("settings.ai.kpi_signals")}</div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-row">
            <div>
              <div className="settings-label">{t("settings.ai.enable_embedding")}</div>
              <div className="settings-help">{t("settings.ai.enable_embedding_desc")}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                className="settings-slider"
                style={{ width: 80, cursor: "pointer" }}
                onClick={() => setEnableEmbedding(!enableEmbedding)}
              >
                <div className="fill" style={{ width: enableEmbedding ? "100%" : "0%" }} />
              </div>
            </div>
            <Switch
              checked={enableEmbedding}
              onCheckedChange={setEnableEmbedding}
            />
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">{t("settings.ai.pipeline_interval")}</div>
              <div className="settings-help">{t("settings.ai.pipeline_help")}</div>
            </div>
            <Select.Root value={pipelineInterval} onValueChange={setPipelineInterval}>
              <Select.Trigger className="settings-select" />
              <Select.Content>
                <Select.Item value="6">{t("settings.ai.interval_6h")}</Select.Item>
                <Select.Item value="12">{t("settings.ai.interval_12h")}</Select.Item>
                <Select.Item value="24">{t("settings.ai.interval_24h")}</Select.Item>
              </Select.Content>
            </Select.Root>
            <button
              className="btn-ghost"
              onClick={handleTriggerPipeline}
              disabled={triggeringPipeline || store.pipelineStatus === "running"}
            >
              {triggeringPipeline ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              {t("settings.ai.trigger_pipeline")}
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="settings-panel">
          <div style={{ padding: "14px 18px" }}>
            <div className="settings-panel-title">{t("settings.ai.trust_title")}</div>
            <div className="settings-panel-desc">{t("settings.ai.trust_desc")}</div>
          </div>
          <div style={{ padding: "4px 18px 14px" }}>
            <div className="settings-trust-list">
              <div className="settings-trust-item">
                <span className="w-2 h-2 rounded-full bg-[var(--green-9)] shrink-0 mt-[5px]"></span>
                <span>{t("settings.ai.trust_1")}</span>
              </div>
              <div className="settings-trust-item">
                <span className="w-2 h-2 rounded-full bg-[var(--green-9)] shrink-0 mt-[5px]"></span>
                <span>{t("settings.ai.trust_2")}</span>
              </div>
              <div className="settings-trust-item">
                <span className="w-2 h-2 rounded-full bg-[var(--amber-9)] shrink-0 mt-[5px]"></span>
                <span>{t("settings.ai.trust_3")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-panel">
          <div style={{ padding: "14px 18px" }}>
            <div className="settings-panel-title">{t("settings.ai.packs_title")}</div>
            <div className="settings-panel-desc">{t("settings.ai.packs_desc")}</div>
          </div>
          <div style={{ padding: "4px 18px 14px" }}>
            <div className="settings-pack-row">
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-12)" }}>{t("settings.ai.pack_ai_starter")}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <span className="settings-tag settings-tag--green">{t("settings.ai.pack_tag_active")}</span>
              </div>
            </div>
            <div className="settings-pack-row">
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-12)" }}>{t("settings.ai.pack_developer")}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <span className="settings-tag settings-tag--blue">{t("settings.ai.pack_tag_beta")}</span>
              </div>
            </div>
            <div className="settings-pack-row">
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-12)" }}>{t("settings.ai.pack_design")}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <span className="settings-tag settings-tag--amber">{t("settings.ai.pack_tag_coming")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-panel">
          <div style={{ padding: "14px 18px" }}>
            <div className="settings-panel-title">{t("settings.ai.sync_title")}</div>
            <div className="settings-panel-desc">{t("settings.ai.sync_desc")}</div>
          </div>
          <div style={{ padding: "4px 18px 14px" }}>
            <div className="settings-pack-row">
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--gray-12)" }}>{t("settings.ai.sync_background")}</div>
                <div className="settings-help">{t("settings.ai.sync_background_desc")}</div>
              </div>
              <Switch
                checked={backgroundSync}
                onCheckedChange={setBackgroundSync}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
