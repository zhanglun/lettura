import { useEffect } from "react";
import { Flex, Text, Heading, Button, Box, Progress } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export function InstallingStep() {
  const { t } = useTranslation();
  const {
    installStatus,
    installProgress,
    installResult,
    installError,
    setOnboardingStep,
    completeOnboarding,
  } = useBearStore(
    useShallow((state) => ({
      installStatus: state.installStatus,
      installProgress: state.installProgress,
      installResult: state.installResult,
      installError: state.installError,
      setOnboardingStep: state.setOnboardingStep,
      completeOnboarding: state.completeOnboarding,
    })),
  );

  useEffect(() => {
    if (installStatus === "success") {
      const timer = setTimeout(() => setOnboardingStep("complete"), 1500);
      return () => clearTimeout(timer);
    }
  }, [installStatus]);

  const isInstalling = installStatus === "installing" || installStatus === "idle";
  const isSuccess = installStatus === "success";
  const isPartial = installStatus === "partial_success";
  const isFailed = installStatus === "all_failed";

  if (isInstalling) {
    return (
      <Flex direction="column" align="center" justify="center" gap="5" p="8">
        <Heading size="5">{t("onboarding.installing.title")}</Heading>
        <Text size="2" color="gray">
          {t("onboarding.installing.subtitle")}
        </Text>
        <Box className="w-full max-w-sm">
          <Progress
            value={
              installProgress.total > 0
                ? (installProgress.completed / installProgress.total) * 100
                : 0
            }
            className="w-full"
          />
        </Box>
        <Text size="2" color="gray">
          {t("onboarding.installing.progress", {
            current: installProgress.completed,
            total: installProgress.total,
          })}
        </Text>
      </Flex>
    );
  }

  if (isSuccess) {
    return (
      <Flex direction="column" align="center" justify="center" gap="4" p="8">
        <CheckCircle size={48} className="text-green-9" />
        <Heading size="5">{t("onboarding.installing.success_title")}</Heading>
      </Flex>
    );
  }

  if (isPartial) {
    return (
      <Flex direction="column" align="center" justify="center" gap="4" p="8">
        <AlertTriangle size={48} className="text-yellow-9" />
        <Heading size="5">{t("onboarding.installing.partial_title")}</Heading>
        <Text size="2" color="gray">
          {t("onboarding.installing.partial_subtitle")}
        </Text>
        <Flex gap="3" mt="3">
          <Button variant="outline" onClick={completeOnboarding}>
            {t("onboarding.installing.skip")}
          </Button>
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex direction="column" align="center" justify="center" gap="4" p="8">
      <XCircle size={48} className="text-red-9" />
      <Heading size="5">{t("onboarding.installing.error_title")}</Heading>
      <Text size="2" color="gray">
        {installError || t("onboarding.installing.error_subtitle")}
      </Text>
      <Flex gap="3" mt="3">
        <Button variant="outline" onClick={completeOnboarding}>
          {t("onboarding.installing.skip")}
        </Button>
      </Flex>
    </Flex>
  );
}
