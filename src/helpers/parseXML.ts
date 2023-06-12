import { useLocation } from "react-router-dom";

export const getChannelFavicon = (url: string) => {
  try {
    const hostname = url ? new URL(url).hostname : "";

    return hostname ? `https://icons.duckduckgo.com/ip3/${hostname}.ico` : "";
  } catch (err) {
    console.log('error url', url);
    console.error(err);
    return ''
  }
};

export const useQuery = () => {
  const query = new URLSearchParams(useLocation().search);
  const feedUrl = query.get("feedUrl");
  const type = query.get("type");
  const channelUuid = query.get("channelUuid");

  return [feedUrl, type, channelUuid];
}
