import { IconButton } from "@astryxdesign/core/IconButton";
import { open } from "@tauri-apps/plugin-shell";
import { ExternalLink, Link } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Article, type ArticleResItem } from "@/db";
import { showErrorToast } from "@/helpers/errorHandler";
import { toast } from "@/helpers/toast";

export const ReadingOptions = ({ article }: { article: ArticleResItem }) => {
  const { t } = useTranslation();

  const openInBrowser = () => {
    article && open(article?.link);
  };

  const handleCopyLink = () => {
    const { link } = article;

    navigator.clipboard.writeText(link).then(
      () => {
        toast.message(t("Copied"));
      },
      (err) => {
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
