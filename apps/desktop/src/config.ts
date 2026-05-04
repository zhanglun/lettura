export enum RouteConfig {
  HOME = "/",
  ALL = "/all",
  TODAY = "/today",
  FAVORITE = "/favorite",
  SEARCH = "/search",

  LOCAL = "/local",
  LOCAL_ALL = "/local/all",
  LOCAL_STARRED = "/local/starred",
  LOCAL_TODAY = "/local/today",
  LOCAL_FEED = "/local/feeds/:uuid",
  LOCAL_ARTICLE = "/local/feeds/:uuid/articles/:id",
  LOCAL_TOPICS = "/local/topics",
  LOCAL_TOPIC_DETAIL = "/local/topics/:uuid",

  SERVICE_FRESHRSS = "/service/freshrss",

  CHANNEL = "/channels/:uuid",
  ARTICLE = "/channels/:uuid/articles/:id",

  SETTINGS = "/settings",
}
