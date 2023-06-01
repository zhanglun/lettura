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
