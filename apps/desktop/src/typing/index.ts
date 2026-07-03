export enum ArticleReadStatus {
  UNREAD = 1,
  READ = 2,
}

export enum ArticleStarStatus {
  UNSTAR = 0,
  STARRED = 1,
}

export enum ArticleReadLaterStatus {
  UNSAVED = 0,
  SAVED = 1,
}
export enum SettingTabKey {
  AI = "ai",
  SUBSCRIPTIONS = "subscriptions",
  SOURCES = "sources",
  APPEARANCE = "appearance",
  BEHAVIOR = "behavior",
}

export type {
  SignalSource,
  Signal,
  SignalDetail,
  AIConfigPublic,
  TodayOverview,
  PipelineStatus,
  FeedbackEntry,
  ValidateAIConfigResult,
  PipelineResult,
} from "./today";
