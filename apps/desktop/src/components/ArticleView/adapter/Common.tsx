import { wraperWithRadix } from "../ContentRender";
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
      <div className="pb-5">
        <h1 className="mb-4 text-[28px] font-bold leading-[1.3] text-[var(--gray-12)]">
          {article.title}
        </h1>
        <div className="mb-8 text-[13px] text-[var(--gray-9)]">
          <span className="font-medium text-[var(--accent-9)]">
            {article.feed_title}
          </span>
          {article.author && <span> · {article.author}</span>}
          <span>
            {" "}
            · {Dayjs(new Date(pub_date || new Date())).format("YYYY-MM-DD")}
          </span>
        </div>
      </div>
      <div
        className="reading-detail-content text-[15px] leading-7 text-[var(--gray-12)]"
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
          <div>{wraperWithRadix(content)}</div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-[var(--gray-9)]">
            <p className="text-sm">{t("article.detail.no_content", "No content available")}</p>
            {article.link && (
              <a
                href="#"
                className="text-[11px] text-[var(--accent-9)] hover:underline"
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
