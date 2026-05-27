import { useState, useEffect } from "react";
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
  const [embeddingModel, setEmbeddingModel] = useState("text-embedding-3-small");
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [pipelineInterval, setPipelineInterval] = useState("6");
  const [enableEmbedding, setEnableEmbedding] = useState(true);

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
    store.fetchAIConfig();
    getDedupStats().then(setDedupStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (store.aiConfig) {
      setModel(store.aiConfig.model || "gpt-4o-mini");
      setEmbeddingModel(store.aiConfig.embedding_model || "text-embedding-3-small");
      setBaseUrl(store.aiConfig.base_url || "https://api.openai.com/v1");
      setEnableEmbedding(store.aiConfig.enable_embedding ?? true);
      setPipelineInterval(String(store.aiConfig.pipeline_interval_hours || 6));
    }
  }, [store.aiConfig]);

  const handleValidate = async () => {
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
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveAIConfig({
        apiKey,
        model,
        embeddingModel,
        baseUrl,
        pipelineIntervalHours: parseInt(pipelineInterval) || 1,
        enableEmbedding,
        enableAutoPipeline: store.aiConfig?.enable_auto_pipeline ?? true,
      });
      toast.success(t("settings.ai.saved"));
      store.fetchAIConfig();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerPipeline = async () => {
    setTriggeringPipeline(true);
    try {
      await triggerPipeline("manual");
      toast.success(t("settings.ai.pipeline_triggered"));
    } catch (e) {
      toast.error(String(e));
    } finally {
      setTriggeringPipeline(false);
    }
  };

  return (
    <div className="settings-ai-layout">
      <div className="settings-grid-wide">
        <div className="settings-panel settings-ai-provider-panel">
          <div className="settings-section">
            <div className="settings-ai-head">
              <div>
                <div className="settings-label">{t("settings.ai.provider_title")}</div>
                <div className="settings-help">{t("settings.ai.provider_desc")}</div>
              </div>
              {store.aiConfig?.has_api_key && (
                <span className="settings-tag settings-tag--green">{t("settings.ai.configured")}</span>
              )}
            </div>

            <div className="settings-row">
              <div>
                <label className="settings-label" htmlFor="ai-api-key">
                  {t("settings.ai.api_key")}
                </label>
                <div className="settings-help">{t("settings.ai.api_key_help")}</div>
              </div>
              <input
                id="ai-api-key"
                aria-label={t("settings.ai.api_key")}
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
                <label className="settings-label" htmlFor="ai-base-url">
                  {t("settings.ai.base_url")}
                </label>
                <div className="settings-help">{t("settings.ai.base_url_help")}</div>
              </div>
              <input
                id="ai-base-url"
                aria-label={t("settings.ai.base_url")}
                className="settings-input"
                placeholder={t("settings.ai.base_url_placeholder")}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <button className="btn-ghost" onClick={() => setBaseUrl("https://api.openai.com/v1")}>
                {t("settings.ai.reset")}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-panel settings-ai-status-panel">
          <div className="settings-section">
            <div className="settings-ai-head">
              <div>
                <div className="settings-label">{t("settings.ai.analysis_status")}</div>
                <div className="settings-help">{t("settings.ai.analysis_status_help")}</div>
              </div>
              <span className="settings-tag settings-tag--blue">{t("settings.ai.last_analysis")}</span>
            </div>
            <div className="settings-kpi">
              <div className="card">
                <div className="settings-kpi-value">{dedupStats?.total_analyzed ?? 0}</div>
                <div className="settings-kpi-label">{t("settings.ai.dedup_total")}</div>
              </div>
              <div className="card">
                <div className="settings-kpi-value">{dedupStats?.duplicates_found ?? 0}</div>
                <div className="settings-kpi-label">{t("settings.ai.dedup_duplicates")}</div>
              </div>
              <div className="card">
                <div className="settings-kpi-value">{dedupStats?.duplicate_groups ?? 0}</div>
                <div className="settings-kpi-label">{t("settings.ai.dedup_groups")}</div>
              </div>
            </div>
          </div>
          <div className="settings-section">
            <div className="settings-label mb-1">{t("settings.ai.privacy_title")}</div>
            <div className="settings-help">{t("settings.ai.privacy_desc")}</div>
          </div>
        </div>
      </div>

      <div className="settings-panel settings-ai-run-panel">
        <div className="settings-section">
          <div className="settings-label mb-1">{t("settings.ai.modeling_title")}</div>
          <div className="settings-help mb-3">{t("settings.ai.modeling_desc")}</div>

          <div className="settings-row">
            <div>
              <div className="settings-label">{t("settings.ai.model")}</div>
              <div className="settings-help">{t("settings.ai.model_help")}</div>
            </div>
            <Select.Root value={model} onValueChange={setModel}>
              <Select.Trigger className="settings-select" />
              <Select.Content>
                {model !== "gpt-4o-mini" && model !== "gpt-4.1-mini" && model && (
                  <Select.Item value={model}>{model}</Select.Item>
                )}
                <Select.Item value="gpt-4o-mini">gpt-4o-mini</Select.Item>
                <Select.Item value="gpt-4.1-mini">gpt-4.1-mini</Select.Item>
              </Select.Content>
            </Select.Root>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? t("settings.ai.saving") : t("settings.ai.save")}
            </button>
          </div>

          <div className="settings-row">
            <div>
              <div className="settings-label">{t("settings.ai.enable_embedding")}</div>
              <div className="settings-help">{t("settings.ai.enable_embedding_desc")}</div>
            </div>
            <Select.Root value={embeddingModel} onValueChange={setEmbeddingModel}>
              <Select.Trigger className="settings-select" />
              <Select.Content>
                {embeddingModel !== "text-embedding-3-small" &&
                  embeddingModel !== "text-embedding-3-large" &&
                  embeddingModel && (
                    <Select.Item value={embeddingModel}>{embeddingModel}</Select.Item>
                  )}
                <Select.Item value="text-embedding-3-small">text-embedding-3-small</Select.Item>
                <Select.Item value="text-embedding-3-large">text-embedding-3-large</Select.Item>
              </Select.Content>
            </Select.Root>
            <Switch checked={enableEmbedding} onCheckedChange={setEnableEmbedding} />
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

          <div className="settings-row">
            <div>
              <div className="settings-label">{t("settings.ai.connection_title")}</div>
              <div className="settings-help">{t("settings.ai.connection_help")}</div>
            </div>
            <div>
              {validationResult?.valid && (
                <span className="settings-tag settings-tag--green">{t("settings.ai.connected")}</span>
              )}
              {!validationResult?.valid && validationResult && (
                <span className="settings-tag settings-tag--amber">{t("settings.ai.validation_failed")}</span>
              )}
            </div>
            <button
              className="btn-ghost"
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
        </div>
      </div>
    </div>
  );
}
