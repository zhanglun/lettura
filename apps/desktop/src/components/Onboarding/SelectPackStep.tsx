import { useEffect, useState } from "react";
import { Button, Flex, Text, Heading, Box, Badge, Card } from "@radix-ui/themes";
import { AlertDialog } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StarterPackSummary } from "@/stores/createOnboardingSlice";
import * as LucideIcons from "lucide-react";

type LucideIconName = keyof typeof LucideIcons;

function PackIcon({ name, ...props }: { name: string } & React.SVGProps<SVGSVGElement>) {
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.Package;
  return <IconComponent {...props} />;
}

function PackCard({
  pack,
  selected,
  onToggle,
}: {
  pack: StarterPackSummary;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        selected ? "ring-2 ring-indigo-9 bg-indigo-2" : ""
      }`}
      onClick={onToggle}
    >
      <Flex direction="column" gap="2" p="3">
        <Flex align="center" gap="2">
          <PackIcon name={pack.icon} width={20} height={20} />
          <Text size="3" weight="bold">
            {pack.name}
          </Text>
        </Flex>
        <Text size="2" color="gray" className="line-clamp-2">
          {pack.description}
        </Text>
        <Flex gap="2" mt="1">
          <Badge color="gray" variant="soft" size="1">
            {pack.source_count} sources
          </Badge>
          {pack.tags.slice(0, 2).map((tag) => (
            <Badge color="gray" variant="outline" size="1" key={tag}>
              {tag}
            </Badge>
          ))}
        </Flex>
      </Flex>
    </Card>
  );
}

export function SelectPackStep() {
  const { t } = useTranslation();
  const {
    packs,
    packsLoading,
    fetchPacks,
    selectedPackIds,
    togglePackSelection,
    setOnboardingStep,
    startInstall,
  } = useBearStore(
    useShallow((state) => ({
      packs: state.packs,
      packsLoading: state.packsLoading,
      fetchPacks: state.fetchPacks,
      selectedPackIds: state.selectedPackIds,
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
    <Flex direction="column" gap="4" p="6">
      <Flex direction="column" gap="1">
        <Heading size="5">{t("onboarding.select_pack.title")}</Heading>
        <Text size="2" color="gray">
          {t("onboarding.select_pack.subtitle")}
        </Text>
      </Flex>

      {packsLoading ? (
        <Flex justify="center" p="6">
          <Text color="gray">Loading...</Text>
        </Flex>
      ) : (
        <Box className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
          {packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              selected={selectedPackIds.includes(pack.id)}
              onToggle={() => togglePackSelection(pack.id)}
            />
          ))}
        </Box>
      )}

      <Flex justify="between" align="center" mt="2">
        <Button
          variant="ghost"
          onClick={() => setOnboardingStep("welcome")}
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
      </Flex>

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
          <Flex gap="3" mt="4" justify="end">
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
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Flex>
  );
}
