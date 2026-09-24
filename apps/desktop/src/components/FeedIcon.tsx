import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { getArticleKind, getPlatformBadge } from "@/helpers/articleKind";
import type { FeedResItem } from "@/db";

/** 源图标：平台/播客用类型徽章语法，其余用标题首字（logo 优先） */
export function FeedIcon({ feed }: { feed: FeedResItem }) {
  const { t } = useTranslation();
  const kind = getArticleKind({ feed_url: feed.feed_url });
  let char = feed.title?.charAt(0)?.toUpperCase() ?? "F";
  let cls = "";

  if (kind === "platform") {
    const badge = getPlatformBadge(
      { feed_url: feed.feed_url },
      { platform: t("fusion.badge.platform"), douyin: t("fusion.badge.douyin") },
    );
    char = badge.char;
    cls = badge.cls;
  } else if (kind === "podcast") {
    char = t("fusion.badge.podcast");
    cls = "b-pod";
  }

  return (
    <span className={clsx("fusion-b-ic", cls)}>
      {feed.logo ? <img src={feed.logo} alt="" /> : char}
    </span>
  );
}
