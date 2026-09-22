import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { getArticleKind, getPlatformBadge } from "@/helpers/articleKind";

/** 类型徽章（文/播/B/抖），列表行、下一篇卡、⌘K 共用 */
export function KindBadge({
  link,
  feed_url,
  media_object,
}: {
  link?: string;
  feed_url?: string;
  media_object?: string;
}) {
  const { t } = useTranslation();
  const badge = useMemo(() => {
    const kind = getArticleKind({ link, feed_url, media_object });
    if (kind === "podcast") {
      return { char: t("fusion.badge.podcast"), cls: "b-pod" };
    }
    if (kind === "platform") {
      return getPlatformBadge(
        { link, feed_url },
        { platform: t("fusion.badge.platform"), douyin: t("fusion.badge.douyin") },
      );
    }
    return { char: t("fusion.badge.article"), cls: "b-art" };
  }, [link, feed_url, media_object, t]);

  return <span className={clsx("fusion-badge", badge.cls)}>{badge.char}</span>;
}
