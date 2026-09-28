import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { getFeedCarrier, mediaBadge } from "@/helpers/mediaType";
import type { FeedResItem } from "@/db";

const ICON_COLORS = [
  "#D97757",
  "#C78B3C",
  "#5E9F83",
  "#4F88A8",
  "#8A70A8",
  "#B45C7D",
];

function colorForFeed(feed: FeedResItem) {
  const key = feed.uuid || feed.title || "feed";
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return ICON_COLORS[hash % ICON_COLORS.length];
}

/** 源图标：平台/播客用类型徽章语法，其余用标题首字（logo 优先） */
export function FeedIcon({ feed }: { feed: FeedResItem }) {
  const { t } = useTranslation();
  const carrier = getFeedCarrier(feed);
  let char = feed.title?.charAt(0)?.toUpperCase() ?? "F";
  let cls = "";

  if (carrier !== "text") {
    const badge = mediaBadge(carrier, feed.origin, {
      text: t("fusion.badge.article"),
      audio: t("fusion.badge.podcast"),
      video: t("fusion.badge.video"),
      email: t("fusion.badge.email"),
    });
    char = badge.char;
    cls = badge.cls;
  }

  return (
    <span
      className={clsx("fusion-b-ic", !feed.logo && "is-initial", cls)}
      style={feed.logo || cls ? undefined : { backgroundColor: colorForFeed(feed) }}
    >
      {feed.logo ? (
        <img src={feed.logo} alt="" loading="lazy" decoding="async" />
      ) : (
        char
      )}
    </span>
  );
}
