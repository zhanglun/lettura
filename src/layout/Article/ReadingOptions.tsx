import { ExternalLink, Link } from "lucide-react";
import { useBearStore } from "@/stores";
import { Article } from "@/db";
import { open } from "@tauri-apps/api/shell";
import { toast } from "sonner";
import { IconButton, Tooltip } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

export const ReadingOptions = () => {
  const { t } = useTranslation();
  const store = useBearStore((state) => ({
    article: state.article,
    setArticle: state.setArticle,
  }));

  const openInBrowser = () => {
    store.article && open(store.article?.link);
  };

  const handleCopyLink = () => {
    const { link } = store.article as Article;

    navigator.clipboard.writeText(link).then(
      function () {
        toast("Copied");
      },
      function (err) {
        console.error("Async: Could not copy text: ", err);
      }
    );
  };

  return (
    <>
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
        <IconButton size="2" variant="ghost" color="gray" className="text-[var(--gray-12)]" onClick={handleCopyLink}>
          <Link size={16} />
        </IconButton>
      </Tooltip>
    </>
  );
};
