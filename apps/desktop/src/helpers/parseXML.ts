import { useLocation } from "react-router-dom";
import { FeedResItem } from "@/db";
import { showErrorToast } from "@/helpers/errorHandler";

export const getFeedLogo = (url: string) => {
  try {
    const hostname = url ? new URL(url).hostname : "";

    // return hostname ? `https://icons.duckduckgo.com/ip3/${hostname}.ico` : "";
    return hostname ? ` https://unavatar.io/${hostname}` : "";
  } catch (err) {
    showErrorToast(err, "Failed to parse feed URL");
    return "";
  }
};

export const useQuery = () => {
  const query = new URLSearchParams(useLocation().search);
  const feedUrl = query.get("feedUrl") || undefined;
  const type = query.get("type") || undefined;
  const feedUuid = query.get("feedUuid") || undefined;

  return [feedUrl, type, feedUuid];
};

