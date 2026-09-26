import { ExternalLink } from "lucide-react";
import { Button } from "@astryxdesign/core/Button";
import { ArticleResItem } from "@/db";
import { open } from "@tauri-apps/plugin-shell";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { platformName } from "@/helpers/mediaType";
import { renderArticleContent } from "../ContentRender";

export interface PlatformAdapterProps {
  article: ArticleResItem;
  content: string;
}

/** 平台详情（B站/抖音/YouTube）：封面块 + feed 简介 + 黑色外跳钮（0.2.0 不做站内播放） */
export function PlatformAdapter({ article, content }: PlatformAdapterProps) {
  const { t } = useTranslation();
  const platform = platformName(article.origin, {
    bilibili: t("fusion.platform.bilibili"),
    douyin: t("fusion.platform.douyin"),
    youtube: t("fusion.platform.youtube"),
    generic: t("fusion.filter.video"),
  });
  const summary = content || article.description;

  return (
    <div className="mx-auto w-full max-w-[640px] py-2">
      <div className="fusion-dkind" style={{ color: "var(--fusion-pink)" }}>
        {platform}
      </div>

      <div className="fusion-platcover">
        {article.image ? (
          <img src={article.image} alt="" className="h-full w-full object-cover rounded-[14px]" />
        ) : (
          <svg width="44" height="44" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <path d="M6 4.5 8 7M14 4.5 12 7M4 7h12v8.5H4zM8 10.5v2M12 10.5v2" />
          </svg>
        )}
      </div>

      <h1 className="text-[24px] font-bold leading-[1.4] text-[var(--fusion-ink)] mt-6">
        {article.title}
      </h1>
      <div className="fusion-dmeta">
        <span>{article.feed_title}</span>
        <span className="sep">·</span>
        <span>{dayjs(article.pub_date || article.create_date).format("YYYY-MM-DD HH:mm")}</span>
      </div>

      {summary && (
        <div className="text-[13.5px] leading-[1.85] text-[#4A4D52] mb-5">
          {renderArticleContent(summary)}
        </div>
      )}

      {article.link && (
        <Button
          variant="primary"
          size="sm"
          label={t("fusion.platform.open_on", { platform })}
          endContent={<ExternalLink size={12} />}
          onClick={() => open(article.link)}
        />
      )}
      <p className="mt-5 text-[12px] text-[var(--fusion-ter)]">
        {t("fusion.platform.hint")}
      </p>
    </div>
  );
}
