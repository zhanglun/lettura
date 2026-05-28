import { Button } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import {
  Bot,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Code2,
  FlaskConical,
  Lightbulb,
  Palette,
  Rocket,
} from "lucide-react";

const INTERESTS = [
  { id: "ai", icon: Bot, label: "AI & ML" },
  { id: "developer", icon: Code2, label: "Developer Tools" },
  { id: "startup", icon: Rocket, label: "Startup" },
  { id: "design", icon: Palette, label: "Design & UX" },
  { id: "product", icon: Lightbulb, label: "Product" },
  { id: "research", icon: FlaskConical, label: "Research" },
  { id: "business", icon: Briefcase, label: "Business" },
];

export function InterestStep() {
  const { t } = useTranslation();
  const {
    selectedInterestIds,
    toggleInterestSelection,
    setOnboardingStep,
  } = useBearStore(
    useShallow((state) => ({
      selectedInterestIds: state.selectedInterestIds,
      toggleInterestSelection: state.toggleInterestSelection,
      setOnboardingStep: state.setOnboardingStep,
    })),
  );

  return (
    <div className="onboarding-step-card">
      <div className="onboarding-step-label">
        {t("onboarding.interests.step")}
      </div>
      <h2 className="onboarding-step-title">
        {t("onboarding.interests.title")}
      </h2>
      <p className="onboarding-step-subtitle">
        {t("onboarding.interests.subtitle")}
      </p>

      <div className="onboarding-interest-grid">
        {INTERESTS.map((interest) => {
          const Icon = interest.icon;
          const selected = selectedInterestIds.includes(interest.id);
          return (
            <button
              type="button"
              key={interest.id}
              className={
                selected
                  ? "onboarding-interest-card onboarding-interest-card--selected"
                  : "onboarding-interest-card"
              }
              onClick={() => toggleInterestSelection(interest.id)}
            >
              <Icon size={22} />
              <span>{interest.label}</span>
            </button>
          );
        })}
      </div>

      <div className="onboarding-step-actions">
        <Button
          variant="ghost"
          onClick={() => setOnboardingStep("welcome")}
        >
          <ChevronLeft size={16} />
          {t("onboarding.select_pack.back")}
        </Button>
        <Button
          disabled={selectedInterestIds.length === 0}
          onClick={() => setOnboardingStep("select-pack")}
        >
          {t("onboarding.interests.next")}
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
