import { ExternalLink, Link } from "lucide-react";
import { Article, ArticleResItem } from "@/db";
import { open } from "@tauri-apps/plugin-shell";
import { toast } from "sonner";
import { IconButton } from "@astryxdesign/core/IconButton";
import { useTranslation } from "react-i18next";
import { showErrorToast } from "@/helpers/errorHandler";

export const ReadingOptions = ({ article }: { article: ArticleResItem }) => {
  const { t } = useTranslation();

  const openInBrowser = () => {
    article && open(article?.link);
  };

  const handleCopyLink = () => {
    const { link } = article;

    navigator.clipboard.writeText(link).then(
      function () {
        toast(t("Copied"));
      },
      function (err) {
        showErrorToast(err, t("Failed to copy link"));
      },
    );
  };

  return (
    <div className="flex items-center gap-4">
      <IconButton
        size="md"
        variant="ghost"
        tooltip={t("Open in browser")}
        label={t("Open in browser")}
        onClick={() => openInBrowser()}
        icon={<ExternalLink size={16} />}
      />
      <IconButton
        size="md"
        variant="ghost"
        tooltip={t("Copy link")}
        label={t("Copy link")}
        onClick={handleCopyLink}
        icon={<Link size={16} />}
      />
    </div>
  );
};
