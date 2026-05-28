import { useEffect } from "react";
import { Button, Progress } from "@radix-ui/themes";
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
      <div className="onboarding-step-card onboarding-step-card--centered">
        <h2 className="onboarding-step-title">{t("onboarding.installing.title")}</h2>
        <p className="onboarding-step-subtitle">
          {t("onboarding.installing.subtitle")}
        </p>
        <div className="onboarding-progress-box">
          <Progress
            value={
              installProgress.total > 0
                ? (installProgress.completed / installProgress.total) * 100
                : 0
            }
            className="w-full"
          />
        </div>
        <p className="onboarding-step-subtitle">
          {t("onboarding.installing.progress", {
            current: installProgress.completed,
            total: installProgress.total,
          })}
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="onboarding-step-card onboarding-step-card--centered">
        <CheckCircle size={48} className="text-green-9" />
        <h2 className="onboarding-step-title">{t("onboarding.installing.success_title")}</h2>
      </div>
    );
  }

  if (isPartial) {
    return (
      <div className="onboarding-step-card onboarding-step-card--centered">
        <AlertTriangle size={48} className="text-yellow-9" />
        <h2 className="onboarding-step-title">{t("onboarding.installing.partial_title")}</h2>
        <p className="onboarding-step-subtitle">
          {t("onboarding.installing.partial_subtitle")}
        </p>
        <div className="onboarding-step-actions onboarding-step-actions--center">
          <Button variant="outline" onClick={completeOnboarding}>
            {t("onboarding.installing.skip")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-step-card onboarding-step-card--centered">
      <XCircle size={48} className="text-red-9" />
      <h2 className="onboarding-step-title">{t("onboarding.installing.error_title")}</h2>
      <p className="onboarding-step-subtitle">
        {installError || t("onboarding.installing.error_subtitle")}
      </p>
      <div className="onboarding-step-actions onboarding-step-actions--center">
        <Button variant="outline" onClick={completeOnboarding}>
          {t("onboarding.installing.skip")}
        </Button>
      </div>
    </div>
  );
}
