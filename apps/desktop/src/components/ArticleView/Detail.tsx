import { Button } from "@astryxdesign/core/Button";
import { open } from "@tauri-apps/plugin-shell";
import { ExternalLink } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ArticleResItem } from "@/db";
import {
  pickArticleContent,
  processArticleHtml,
} from "@/helpers/articleContent";
import { apiGet } from "@/helpers/http";
import { canPlayInApp, getCarrier, opensExternally } from "@/helpers/mediaType";
import { CommonAdapter } from "./adapter/Common";
import { PlatformAdapter } from "./adapter/Platform";
import { PodcastAdapter } from "./adapter/Podcast";

/** 详情面的三种载体形态（三选一，用枚举而非三个互斥布尔） */
type DetailSurface = "common" | "platform" | "podcast";

function validateFeed(article: ArticleResItem, medias: any): DetailSurface {
  // 载体定消费方式：audio → 站内播放器；video → 外跳；text/email → 阅读面
  const carrier = getCarrier(article);
  if (opensExternally(carrier)) {
    return "platform";
  }
  if (canPlayInApp(carrier) && medias?.length > 0) {
    return "podcast";
  }
  return "common";
}

export interface ArticleDetailProps {
  article: any;
}

export const ArticleDetail = (props: ArticleDetailProps) => {
  const { article } = props;
  const { t } = useTranslation();
  const [pageContent, setPageContent] = useState("");
  const [medias, setMedias] = useState([]);
  const [loadError, setLoadError] = useState(false);

  function delegateContentClick(e: React.MouseEvent<HTMLElement>) {
    let elem = null;
    const i = e.nativeEvent.composedPath();

    for (let a = 0; a <= i.length - 1; a++) {
      const s = i[a] as HTMLElement;
      if ("A" === s.tagName) {
        elem = s;
        break;
      }
    }

    if (elem?.getAttribute("href")) {
      e.preventDefault();
      e.stopPropagation();

      const href = elem.getAttribute("href") || "";

      if (
        href &&
        (href.indexOf("http://") >= 0 ||
          href.indexOf("https://") >= 0 ||
          href.indexOf("www.") >= 0)
      ) {
        open(href);
      } else if (href.indexOf("#") === 0) {
        open(`${article.link}${href}`);
      }
    }
  }

  function renderMain() {
    if (!article) return null;

    if (loadError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-[var(--fusion-ter)]">
          <p className="text-sm">
            {t("article.detail.load_error", "Failed to load article content")}
          </p>
          {article.link && (
            <Button
              variant="ghost"
              size="sm"
              icon={<ExternalLink size={12} />}
              label={t("Open in browser")}
              onClick={() => open(article.link)}
            />
          )}
        </div>
      );
    }

    const surface = validateFeed(article, medias || []);

    if (surface === "platform") {
      return <PlatformAdapter article={article} content={pageContent} />;
    } else if (surface === "podcast") {
      return (
        <PodcastAdapter
          article={article}
          content={pageContent}
          medias={medias}
        />
      );
    } else {
      return (
        <CommonAdapter
          article={article}
          content={pageContent}
          delegateContentClick={delegateContentClick}
        />
      );
    }
  }

  const articleUuid = article?.uuid as string | undefined;
  const baseUrl = article?.link as string | undefined;

  useEffect(() => {
    if (!articleUuid) return;
    // fetch cannot be allowed to update the next article; cleanup drops stale results.
    let cancelled = false;
    setPageContent("");
    setLoadError(false);

    apiGet<any>(`/articles/${articleUuid}`)
      .then((data) => {
        if (cancelled || !data) return;
        const raw = pickArticleContent(data.content, data.description);
        const processed = processArticleHtml(raw, { baseUrl });
        setPageContent(processed);

        try {
          setMedias(JSON.parse(data.media_object));
        } catch {
          setMedias([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
    // 依赖 uuid 而非对象：打开即标已读的 mutate 会替换对象，重发请求会让正文清空重载
  }, [articleUuid, baseUrl]);

  return renderMain();
};
