import { Flex, Text, Heading, Button } from "@radix-ui/themes";
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
    <Flex direction="column" align="center" justify="center" gap="5" p="8">
      <PartyPopper size={48} className="text-indigo-9" />
      <Flex direction="column" align="center" gap="2" className="max-w-md text-center">
        <Heading size="6" weight="bold">
          {t("onboarding.complete.title")}
        </Heading>
        <Text size="3" color="gray" className="leading-relaxed">
          {t("onboarding.complete.subtitle")}
        </Text>
      </Flex>
      <Button size="3" onClick={completeOnboarding} mt="4">
        {t("onboarding.complete.start_reading")}
      </Button>
    </Flex>
  );
}
