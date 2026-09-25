import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { getFeedCarrier, mediaBadge } from "@/helpers/mediaType";
import type { FeedResItem } from "@/db";

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
    <span className={clsx("fusion-b-ic", cls)}>
      {feed.logo ? <img src={feed.logo} alt="" /> : char}
    </span>
  );
}
