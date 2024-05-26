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

  SERVICE_FRESHRSS = "/service/freshrss",

  CHANNEL = "/channels/:uuid",
  ARTICLE = "/channels/:uuid/articles/:id",

  SETTINGS = "/settings",
  SETTINGS_GENERAL = "/settings/general",
  SETTINGS_APPEARANCE = "/settings/appearance",
  SETTINGS_PROXY = "/settings/proxy",
  SETTINGS_SHORTCUT = "/settings/shortcut",
  SETTINGS_NOTIFICATION = "/settings/notification",
  SETTINGS_FEED_MANAGER = "/settings/feed_manager",
  SETTINGS_IMPORT = "/settings/import",
  SETTINGS_EXPORT = "/settings/export",
}
