import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  TextField,
  Select,
} from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { saveAIConfig, validateAIConfig, triggerPipeline, getDedupStats } from "@/helpers/dataAgent";
import { CheckCircle, XCircle, Loader2, Play, Copy } from "lucide-react";
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
  const [pipelineInterval, setPipelineInterval] = useState("1");

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
  }, []);

  const handleValidate = useCallback(async () => {
    if (!apiKey.trim()) return;
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
  }, [apiKey]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await saveAIConfig({
        apiKey,
        model,
        embeddingModel,
        baseUrl,
        pipelineIntervalHours: parseInt(pipelineInterval) || 1,
      });
      toast.success(t("settings.ai.saved"));
      store.fetchAIConfig();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  }, [apiKey, model, embeddingModel, baseUrl, pipelineInterval, store, t]);

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
    <Flex direction="column" gap="5">
      <Heading size="4">{t("settings.ai.title")}</Heading>

      <Box>
        <Flex direction="column" gap="4" maxWidth="400px">
          <Flex direction="column" gap="1">
            <Text size="2" weight="medium" className="text-[var(--gray-12)]">
              {t("settings.ai.api_key")}
            </Text>
            <Flex gap="2">
              <TextField.Root
                type="password"
                placeholder={t("settings.ai.api_key_placeholder")}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button
                size="2"
                variant="outline"
                onClick={handleValidate}
                disabled={!apiKey.trim() || validating}
              >
                {validating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  t("settings.ai.validate")
                )}
              </Button>
            </Flex>
            {validationResult && (
              <Flex align="center" gap="1" mt="1">
                {validationResult.valid ? (
                  <>
                    <CheckCircle size={14} className="text-[var(--green-9)]" />
                    <Text size="1" className="text-[var(--green-9)]">
                      {t("settings.ai.validation_success")}
                    </Text>
                  </>
                ) : (
                  <>
                    <XCircle size={14} className="text-[var(--red-9)]" />
                    <Text size="1" className="text-[var(--red-9)]">
                      {validationResult.message}
                    </Text>
                  </>
                )}
              </Flex>
            )}
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" weight="medium" className="text-[var(--gray-12)]">
              {t("settings.ai.model")}
            </Text>
            <TextField.Root
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" weight="medium" className="text-[var(--gray-12)]">
              {t("settings.ai.embedding_model")}
            </Text>
            <TextField.Root
              value={embeddingModel}
              onChange={(e) => setEmbeddingModel(e.target.value)}
            />
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" weight="medium" className="text-[var(--gray-12)]">
              {t("settings.ai.base_url")}
            </Text>
            <TextField.Root
              placeholder={t("settings.ai.base_url_placeholder")}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </Flex>

          <Flex direction="column" gap="1">
            <Text size="2" weight="medium" className="text-[var(--gray-12)]">
              {t("settings.ai.pipeline_interval")}
            </Text>
            <TextField.Root
              type="number"
              min="1"
              value={pipelineInterval}
              onChange={(e) => setPipelineInterval(e.target.value)}
            />
          </Flex>

          <Flex gap="3" mt="2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("settings.ai.saving") : t("settings.ai.save")}
            </Button>
            <Button
              variant="outline"
              onClick={handleTriggerPipeline}
              disabled={triggeringPipeline || store.pipelineStatus === "running"}
            >
              {triggeringPipeline ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              {t("settings.ai.trigger_pipeline")}
            </Button>
          </Flex>
        </Flex>
      </Box>

      {dedupStats && dedupStats.total_analyzed > 0 && (
        <Box mt="4">
          <Heading size="3" mb="3">{t("settings.ai.dedup_stats_title")}</Heading>
          <Flex gap="4" wrap="wrap">
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">{t("settings.ai.dedup_total")}</Text>
              <Text size="4" weight="bold">{dedupStats.total_analyzed}</Text>
            </Flex>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">{t("settings.ai.dedup_duplicates")}</Text>
              <Text size="4" weight="bold">{dedupStats.duplicates_found}</Text>
            </Flex>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">{t("settings.ai.dedup_groups")}</Text>
              <Text size="4" weight="bold">{dedupStats.duplicate_groups}</Text>
            </Flex>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">{t("settings.ai.dedup_avg_density")}</Text>
              <Text size="4" weight="bold">{dedupStats.avg_information_density.toFixed(2)}</Text>
            </Flex>
          </Flex>
        </Box>
      )}
    </Flex>
  );
}
