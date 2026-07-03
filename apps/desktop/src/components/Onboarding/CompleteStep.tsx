import { Button } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { PartyPopper } from "lucide-react";

export function CompleteStep() {
  const { t } = useTranslation();
  const { completeOnboarding } = useBearStore(
    useShallow((state) => ({
      completeOnboarding: state.completeOnboarding,
    })),
  );

  return (
    <div className="onboarding-step-card onboarding-step-card--centered">
      <PartyPopper size={48} className="text-indigo-9" />
      <div className="onboarding-copy">
        <h2 className="onboarding-step-title">
          {t("onboarding.complete.title")}
        </h2>
        <p className="onboarding-step-subtitle">
          {t("onboarding.complete.subtitle")}
        </p>
      </div>
      <Button size="3" onClick={completeOnboarding}>
        {t("onboarding.complete.start_reading")}
      </Button>
    </div>
  );
}
