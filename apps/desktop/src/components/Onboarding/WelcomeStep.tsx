import { Button, Flex, Text, Heading, Box } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { useBearStore } from "@/stores";
import { useShallow } from "zustand/react/shallow";
import { FileUp } from "lucide-react";
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
    <Flex direction="column" align="center" justify="center" gap="6" p="8">
      <Flex
        direction="column"
        align="center"
        gap="4"
        className="max-w-md text-center"
      >
        <Heading size="7" weight="bold">
          {t("onboarding.welcome.title")}
        </Heading>
        <Text size="3" color="gray" className="leading-relaxed">
          {t("onboarding.welcome.subtitle")}
        </Text>
      </Flex>

      <Flex direction="column" gap="3" className="w-full max-w-xs mt-4">
        <Button
          size="3"
          onClick={() => setOnboardingStep("select-pack")}
          className="w-full"
        >
          {t("onboarding.welcome.get_started")}
        </Button>

        <Box className="relative my-2">
          <Box className="absolute inset-0 flex items-center">
            <Box className="w-full border-t border-gray-5" />
          </Box>
          <Box className="relative flex justify-center">
            <Text size="2" color="gray" className="bg-[var(--color-panel-solid)] px-3">
              or
            </Text>
          </Box>
        </Box>

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
          <Text size="2" color="red" className="text-center">
            {t("onboarding.welcome.import_error")}
          </Text>
        )}
      </Flex>
    </Flex>
  );
}
