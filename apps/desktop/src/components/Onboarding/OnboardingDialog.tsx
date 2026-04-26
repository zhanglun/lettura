import { Dialog } from "@radix-ui/themes";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { WelcomeStep } from "./WelcomeStep";
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
        className="!p-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {onboardingStep === "welcome" && <WelcomeStep />}
        {onboardingStep === "select-pack" && <SelectPackStep />}
        {onboardingStep === "installing" && <InstallingStep />}
        {onboardingStep === "complete" && <CompleteStep />}
      </Dialog.Content>
    </Dialog.Root>
  );
}
