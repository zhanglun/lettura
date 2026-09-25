import { renderArticleContent } from "../ContentRender";
import { ArticleResItem } from "@/db";
import Dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useState } from "react";

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

  return (
    <div className="pb-20">
      {/* fusion 详情头部：类型标签 + 24px 题 + 灰 meta */}
      <div className="fusion-dkind">{t("fusion.filter.article")}</div>
      <h1 className="mb-3 text-[24px] font-bold leading-[1.4] text-[var(--fusion-ink)]">
        {article.title}
      </h1>
      <div className="fusion-dmeta">
        <span>{article.feed_title}</span>
        {article.author && (
          <>
            <span>·</span>
            <span>{article.author}</span>
          </>
        )}
        <span>·</span>
        <span>
          {Dayjs(new Date(pub_date || new Date())).format("YYYY-MM-DD HH:mm")}
        </span>
      </div>
      <div
        className="reading-detail-content fusion-article-body mt-8"
        onClick={delegateContentClick}
      >
        {article.image && !imgError && (
          <div className="my-6 w-full text-center">
            <img
              src={article.image}
              alt=""
              className="max-h-[420px] w-full rounded-md object-cover"
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
                className="text-[11px] text-[var(--fusion-accent)] hover:underline"
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
