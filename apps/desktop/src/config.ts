export enum RouteConfig {
  HOME = "/",
  ALL = "/all",
  TODAY = "/today",
  FAVORITE = "/favorite",

  LOCAL = "/local",
  LOCAL_ALL = "/local/all",
  LOCAL_STARRED = "/local/starred",
  LOCAL_TODAY = "/local/today",
  LOCAL_FEEDS = "/local/feeds",
  LOCAL_FEED = "/local/feeds/:uuid",
  LOCAL_ARTICLE = "/local/feeds/:uuid/articles/:id",

  CHANNEL = "/channels/:uuid",
  ARTICLE = "/channels/:uuid/articles/:id",

  SETTINGS = "/settings",
}
