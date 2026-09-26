import { renderArticleContent } from "../ContentRender";
import { ArticleResItem } from "@/db";
import Dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { estimateReadMinutes } from "@/helpers/articleContent";

export interface CommonAdapterProps {
  content: string;
  article: ArticleResItem;
  delegateContentClick: any;
}

export const CommonAdapter = ({
  article,
  delegateContentClick,
  content,
}: CommonAdapterProps) => {
  const { t } = useTranslation();
  const { pub_date } = article;
  const [imgError, setImgError] = useState(false);
  // 阅读时长：正文就绪后估算（detail.html d-meta「约 N 分钟」契约），<1 分钟不显示
  const readMinutes = useMemo(
    () => estimateReadMinutes(content || article.description || ""),
    [content, article.description],
  );

  return (
    // 完读区（fin/下一篇卡）紧随其后：底部留白交给 fin 的 38px，不再叠 adapter 的 pb
    <div>
      {/* fusion 详情头部：类型标签 + 24px 题 + 灰 meta（题/meta 是外壳 → sans，正文才落宋体） */}
      <div className="fusion-dkind">{t("fusion.filter.article")}</div>
      <h1 className="fusion-dtitle mb-3 text-[24px] font-bold leading-[1.4] text-[var(--fusion-ink)]">
        {article.title}
      </h1>
      <div className="fusion-dmeta">
        <span>{article.feed_title}</span>
        {article.author && (
          <>
            <span className="sep">·</span>
            <span>{article.author}</span>
          </>
        )}
        <span className="sep">·</span>
        <span>
          {Dayjs(new Date(pub_date || new Date())).format("YYYY-MM-DD HH:mm")}
        </span>
        {readMinutes >= 1 && (
          <>
            <span className="sep">·</span>
            <span>{t("fusion.read.time", { min: readMinutes })}</span>
          </>
        )}
      </div>
      <div
        className="reading-detail-content fusion-article-body mt-4"
        onClick={delegateContentClick}
      >
        {article.image && !imgError && (
          <div className="my-6 w-full text-center">
            <img
              src={article.image}
              alt=""
              className="max-h-[420px] w-full object-cover"
              onError={() => setImgError(true)}
            />
          </div>
        )}
        {content ? (
          <div>{renderArticleContent(content)}</div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-[var(--fusion-ter)]">
            <p className="text-sm">{t("article.detail.no_content", "No content available")}</p>
            {article.link && (
              <a
                href="#"
                className="text-[11px] text-[var(--color-accent)] hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  import("@tauri-apps/plugin-shell").then(({ open }) =>
                    open(article.link),
                  );
                }}
              >
                {t("Open in browser")}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
