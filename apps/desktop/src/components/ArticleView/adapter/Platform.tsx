import { ArticleResItem } from "@/db";
import { open } from "@tauri-apps/plugin-shell";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { getPlatformName } from "@/helpers/articleKind";
import { wraperWithRadix } from "../ContentRender";

export interface PlatformAdapterProps {
  article: ArticleResItem;
  content: string;
}

/** 平台详情（B站/抖音/YouTube）：封面块 + feed 简介 + 黑色外跳钮（0.2.0 不做站内播放） */
export function PlatformAdapter({ article, content }: PlatformAdapterProps) {
  const { t } = useTranslation();
  const platform = getPlatformName(article, {
    bilibili: t("fusion.platform.bilibili"),
    douyin: t("fusion.platform.douyin"),
    youtube: t("fusion.platform.youtube"),
    generic: t("fusion.filter.platform"),
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
        <span>·</span>
        <span>{dayjs(article.pub_date || article.create_date).format("YYYY-MM-DD HH:mm")}</span>
      </div>

      {summary && (
        <div className="text-[13.5px] leading-[1.85] text-[#4A4D52] mb-5">
          {wraperWithRadix(summary)}
        </div>
      )}

      {article.link && (
        <button type="button" className="fusion-openbtn" onClick={() => open(article.link)}>
          {t("fusion.platform.open_on", { platform })}
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round">
            <path d="M6.5 3H3v10h10V9.5M9 3h4v4M12.8 3.2 7.5 8.5" />
          </svg>
        </button>
      )}
      <p className="mt-5 text-[12px] text-[var(--fusion-ter)]">
        {t("fusion.platform.hint")}
      </p>
    </div>
  );
}
