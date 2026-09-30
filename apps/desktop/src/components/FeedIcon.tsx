import clsx from "clsx";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { FeedResItem } from "@/db";
import { getFeedCarrier, mediaBadge } from "@/helpers/mediaType";

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

/** 源图标：平台/播客用类型徽章语法，其余用标题首字（logo 优先，挂了退回首字） */
export function FeedIcon({ feed }: { feed: FeedResItem }) {
  const { t } = useTranslation();
  const [logoBroken, setLogoBroken] = useState(false);
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

  const showLogo = !!feed.logo && !logoBroken;

  return (
    <span
      className={clsx("fusion-b-ic", !showLogo && "is-initial", cls)}
      style={
        showLogo || cls ? undefined : { backgroundColor: colorForFeed(feed) }
      }
    >
      {showLogo ? (
        <img
          src={feed.logo}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setLogoBroken(true)}
        />
      ) : (
        char
      )}
    </span>
  );
}
