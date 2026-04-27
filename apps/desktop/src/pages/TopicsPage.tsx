import { useTranslation } from "react-i18next";
import { Text } from "@radix-ui/themes";
import { Layers } from "lucide-react";
import { MainPanel } from "@/components/MainPanel";

export function TopicsPage() {
  const { t } = useTranslation();

  return (
    <MainPanel>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="mb-4">
          <Layers size={48} className="text-[var(--gray-6)]" />
        </div>
        <Text size="5" weight="medium" className="mb-2 text-[var(--gray-12)]">
          {t("topics.empty_title")}
        </Text>
        <Text className="text-[var(--gray-11)]">
          {t("topics.empty_description")}
        </Text>
      </div>
    </MainPanel>
  );
}
