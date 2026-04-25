import { ExternalLink, Link } from "lucide-react";
import { Article, ArticleResItem } from "@/db";
import { open } from "@tauri-apps/plugin-shell";
import { toast } from "sonner";
import { IconButton, Tooltip } from "@radix-ui/themes";
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
      <Tooltip content={t("Open in browser")}>
        <IconButton
          size="2"
          variant="ghost"
          color="gray"
          className="text-[var(--gray-12)]"
          onClick={() => openInBrowser()}
        >
          <ExternalLink size={16} />
        </IconButton>
      </Tooltip>
      <Tooltip content={t("Copy link")}>
        <IconButton
          size="2"
          variant="ghost"
          color="gray"
          className="text-[var(--gray-12)]"
          onClick={handleCopyLink}
        >
          <Link size={16} />
        </IconButton>
      </Tooltip>
    </div>
  );
};
