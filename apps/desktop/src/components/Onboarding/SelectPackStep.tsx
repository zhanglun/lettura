import { useEffect, useState } from "react";
import { Button } from "@radix-ui/themes";
import { AlertDialog } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getPackInterestScore,
  type StarterPackSummary,
} from "@/stores/createOnboardingSlice";
import * as LucideIcons from "lucide-react";

type LucideIconName = keyof typeof LucideIcons;

function PackIcon({ name, ...props }: { name: string } & React.SVGProps<SVGSVGElement>) {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Package;
  return <IconComponent {...props} />;
}

function PackCard({
  pack,
  selected,
  recommended,
  onToggle,
}: {
  pack: StarterPackSummary;
  selected: boolean;
  recommended: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={
        selected
          ? "onboarding-pack-card onboarding-pack-card--selected"
          : "onboarding-pack-card"
      }
      onClick={onToggle}
    >
      <div className="onboarding-pack-icon">
        <PackIcon name={pack.icon} width={22} height={22} />
      </div>
      <div className="onboarding-pack-body">
        <div className="onboarding-pack-name">
          {pack.name}
        </div>
        <p className="onboarding-pack-desc">
          {pack.description}
        </p>
        {recommended && (
          <div className="onboarding-pack-recommended">
            {t("onboarding.select_pack.recommended")}
          </div>
        )}
        <div className="onboarding-pack-meta">
          <span>
            {pack.source_count} sources
          </span>
          {pack.tags.slice(0, 2).map((tag) => (
            <span key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="onboarding-pack-check" aria-hidden="true" />
    </button>
  );
}

export function SelectPackStep() {
  const { t } = useTranslation();
  const {
    packs,
    packsLoading,
    fetchPacks,
    selectedPackIds,
    selectedInterestIds,
    togglePackSelection,
    setOnboardingStep,
    startInstall,
  } = useBearStore(
    useShallow((state) => ({
      packs: state.packs,
      packsLoading: state.packsLoading,
      fetchPacks: state.fetchPacks,
      selectedPackIds: state.selectedPackIds,
      selectedInterestIds: state.selectedInterestIds,
      togglePackSelection: state.togglePackSelection,
      setOnboardingStep: state.setOnboardingStep,
      startInstall: state.startInstall,
    })),
  );

  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetchPacks();
  }, []);

  const totalSources = packs
    .filter((p) => selectedPackIds.includes(p.id))
    .reduce((sum, p) => sum + p.source_count, 0);

  const handleInstall = async () => {
    setConfirmOpen(false);
    setOnboardingStep("installing");
    await startInstall(selectedPackIds);
  };

  return (
    <div className="onboarding-step-card">
      <div className="onboarding-step-label">
        {t("onboarding.select_pack.step")}
      </div>
      <h2 className="onboarding-step-title">{t("onboarding.select_pack.title")}</h2>
      <p className="onboarding-step-subtitle">
        {t("onboarding.select_pack.subtitle")}
      </p>

      {packsLoading ? (
        <div className="onboarding-loading">Loading...</div>
      ) : (
        <div className="onboarding-pack-list">
          {packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              selected={selectedPackIds.includes(pack.id)}
              recommended={getPackInterestScore(pack, selectedInterestIds) > 0}
              onToggle={() => togglePackSelection(pack.id)}
            />
          ))}
        </div>
      )}

      <div className="onboarding-step-actions">
        <Button
          variant="ghost"
          onClick={() => setOnboardingStep("interests")}
        >
          <ChevronLeft size={16} />
          {t("onboarding.select_pack.back")}
        </Button>

        <Button
          disabled={selectedPackIds.length === 0}
          onClick={() => setConfirmOpen(true)}
        >
          {t("onboarding.select_pack.install")}
          <ChevronRight size={16} />
        </Button>
      </div>

      <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialog.Content maxWidth="400px">
          <AlertDialog.Title>
            {t("onboarding.select_pack.confirm_title")}
          </AlertDialog.Title>
          <AlertDialog.Description size="2">
            {t("onboarding.select_pack.confirm_description", {
              count: selectedPackIds.length,
              sources: totalSources,
            })}
          </AlertDialog.Description>
          <div className="mt-4 flex justify-end gap-3">
            <AlertDialog.Cancel>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                {t("Cancel")}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button onClick={handleInstall}>
                {t("onboarding.select_pack.confirm_button")}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </div>
  );
}
