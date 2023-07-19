export enum RouteConfig {
  HOME = "/",
  ALL = "/all",
  TODAY = "/today",
  FAVORITE = "/favorite",

  CHANNEL = "/channels/:uuid",
  ARTICLE = "/channels/:uuid/articles/:id",

  SETTINGS = "/settings",
  SETTINGS_GENERAL = "/settings/general",
  SETTINGS_APPEARANCE = "/settings/appearance",
  SETTINGS_SHORTCUT = "/settings/shortcut",
  SETTINGS_NOTIFICATION = "/settings/notification",
  SETTINGS_FEED_MANAGER = "/settings/feed_manager",
  SETTINGS_IMPORT = "/settings/import",
  SETTINGS_EXPORT = "/settings/export",
}
