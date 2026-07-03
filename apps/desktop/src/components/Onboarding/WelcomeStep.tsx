import { Button } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { ChevronRight, FileUp, Rss } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";

export function WelcomeStep() {
  const { t } = useTranslation();
  const { setOnboardingStep, importOpmlAsSource, opmlImporting, opmlImportError } =
    useBearStore(
      useShallow((state) => ({
        setOnboardingStep: state.setOnboardingStep,
        importOpmlAsSource: state.importOpmlAsSource,
        opmlImporting: state.opmlImporting,
        opmlImportError: state.opmlImportError,
      })),
    );

  const handleImportOpml = async () => {
    try {
      const filePath = await open({
        multiple: false,
        filters: [{ name: "OPML", extensions: ["xml", "opml"] }],
      });
      if (!filePath) return;

      const content = await readTextFile(filePath as string);
      await importOpmlAsSource(content);
    } catch {
      // importOpmlAsSource already sets opmlImportError
    }
  };

  return (
    <div className="onboarding-step-card onboarding-step-card--centered">
      <div className="onboarding-brand-icon">
        <Rss size={28} />
      </div>
      <div className="onboarding-copy">
        <h1 className="onboarding-welcome-title">
          {t("onboarding.welcome.title")}
        </h1>
        <p className="onboarding-welcome-subtitle">
          {t("onboarding.welcome.subtitle")}
        </p>
      </div>

      <div className="onboarding-primary-actions">
        <Button
          size="3"
          onClick={() => setOnboardingStep("interests")}
          className="w-full"
        >
          {t("onboarding.welcome.get_started")}
          <ChevronRight size={16} />
        </Button>

        <div className="onboarding-divider">
          <span>or</span>
        </div>

        <Button
          variant="outline"
          size="3"
          onClick={handleImportOpml}
          disabled={opmlImporting}
          className="w-full"
        >
          <FileUp size={16} />
          {opmlImporting
            ? t("onboarding.welcome.importing")
            : t("onboarding.welcome.import_opml")}
        </Button>

        {opmlImportError && (
          <p className="onboarding-error-text">
            {t("onboarding.welcome.import_error")}
          </p>
        )}
      </div>
    </div>
  );
}
