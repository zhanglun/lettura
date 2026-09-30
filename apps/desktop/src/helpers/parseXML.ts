import { useLocation } from "react-router-dom";

export const useQuery = () => {
  const query = new URLSearchParams(useLocation().search);
  const feedUrl = query.get("feedUrl") || undefined;
  const type = query.get("type") || undefined;
  const feedUuid = query.get("feedUuid") || undefined;

  return [feedUrl, type, feedUuid];
};
