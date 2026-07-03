import { Dialog } from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { WelcomeStep } from "./WelcomeStep";
import { InterestStep } from "./InterestStep";
import { SelectPackStep } from "./SelectPackStep";
import { InstallingStep } from "./InstallingStep";
import { CompleteStep } from "./CompleteStep";

export function OnboardingDialog() {
  const { onboardingOpen, onboardingStep } = useBearStore(
    useShallow((state) => ({
      onboardingOpen: state.onboardingOpen,
      onboardingStep: state.onboardingStep,
    })),
  );

  return (
    <Dialog.Root open={onboardingOpen} onOpenChange={() => {}}>
      <Dialog.Content
        maxWidth="680px"
        className="onboarding-dialog !p-0"
        aria-describedby={undefined}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <Dialog.Title className="sr-only">
          Lettura onboarding
        </Dialog.Title>
        {onboardingStep === "welcome" && <WelcomeStep />}
        {onboardingStep === "interests" && <InterestStep />}
        {onboardingStep === "select-pack" && <SelectPackStep />}
        {onboardingStep === "installing" && <InstallingStep />}
        {onboardingStep === "complete" && <CompleteStep />}
      </Dialog.Content>
    </Dialog.Root>
  );
}
