import { invoke } from "@tauri-apps/api/core";
import {
  ArticleResItem,
  FeedResItem,
  SiteRuleSummary,
  SourceAccount,
} from "../db";

// 数据面唯一通道：全部走 Tauri invoke。
// Actix 仅承载 /api/rules 与 /api/generated（本地 RSS 供应，给外部消费），
// 前端不再感知端口，也不再有 HTTP 数据请求。

export const getSubscribes = async (): Promise<FeedResItem[]> => {
  return invoke("get_subscribes");
};

export const createFolder = async (name: string): Promise<number> => {
  return invoke("create_folder", { name });
};

export const updateFolder = async (
  uuid: string,
  name: string,
): Promise<number> => {
  return invoke("update_folder", { uuid, name });
};

export const deleteFolder = async (uuid: string): Promise<number> => {
  return invoke("delete_folder", { uuid });
};

export const moveChannelIntoFolder = async (
  channelUuid: string,
  folderUuid: string,
  sort: number,
): Promise<any> => {
  return invoke("move_channel_into_folder", {
    channelUuid,
    folderUuid,
    sort,
  });
};

/**
 * 删除频道（退订）
 * @param uuid channel 的 uuid
 * @param deleteArticles 是否连带删除文章
 */
export const deleteChannel = async (
  uuid: string,
  deleteArticles: boolean = false,
): Promise<number> => {
  return invoke("delete_feed", { uuid, deleteArticles });
};

export const getArticleList = async (
  filter: any,
): Promise<{ list: ArticleResItem[]; total: number }> => {
  return invoke("get_articles", { filter });
};

export const getCarrierCounts = async (filter: any) => {
  return invoke("get_carrier_counts", { filter });
};

export const fetchFeed = async (
  url: string,
  origin?: string,
  carrier?: string,
  providerHint?: string,
  accountUuid?: string,
): Promise<{
  feed: any;
  resolved_url: string;
  candidates: string[];
  entries: any[];
  message: string;
}> => {
  return invoke("fetch_feed", { url, origin, carrier, providerHint, accountUuid });
};

export const subscribeFeed = async (
  url: string,
  origin?: string,
  carrier?: string,
  providerHint?: string,
  accountUuid?: string,
): Promise<[FeedResItem, number, string]> => {
  return invoke("add_feed", { url, origin, carrier, providerHint, accountUuid });
};

// ── 来源账户（IMAP / B站 cookie 等凭据的宿主）────────────────────

export const listSourceAccounts = async (): Promise<SourceAccount[]> => {
  return invoke("list_source_accounts");
};

/** settings 为 provider 特定的 JSON 字符串（mail: {host, port, user, password}） */
export const saveSourceAccount = async (
  provider: string,
  label: string,
  settings: string,
): Promise<SourceAccount> => {
  return invoke("save_source_account", { provider, label, settings });
};

export const deleteSourceAccount = async (uuid: string): Promise<number> => {
  return invoke("delete_source_account", { uuid });
};

/** 成功返回消息；失败 reject */
export const testSourceAccount = async (
  provider: string,
  settings: string,
): Promise<string> => {
  return invoke("test_source_account", { provider, settings });
};

// ── 站点规则（site-rules：本地转换引擎的配置面）──────────────────

export const listSiteRules = async (): Promise<SiteRuleSummary[]> => {
  return invoke("list_site_rules");
};

/** 导入规则 TOML 内容，成功返回规则 key（同 key 覆盖） */
export const importSiteRule = async (content: string): Promise<string> => {
  return invoke("import_site_rule", { content });
};

export const syncFeed = async (
  feed_type: string,
  uuid: string,
): Promise<{ [key: string]: [string, number, string] }> => {
  return invoke("sync_feed", { feedType: feed_type, uuid });
};

export const getUnreadTotal = async (): Promise<{ [key: string]: number }> => {
  return invoke("get_unread_total");
};

export const getCollectionMetas = async (): Promise<{
  today: { unread: number };
  total: { unread: number };
} | null> => {
  return invoke("get_collection_metas");
};

export const updateArticleReadStatus = async (
  article_uuid: string,
  read_status: number,
) => {
  return invoke("update_article_read_status", { uuid: article_uuid, readStatus: read_status });
};

export const updateArticleStarStatus = async (
  article_uuid: string,
  star_status: number,
) => {
  return invoke("update_article_star_status", { uuid: article_uuid, starred: star_status });
};

export const updateArticleReadLaterStatus = async (
  article_uuid: string,
  is_read_later: number,
) => {
  return invoke("update_article_read_later_status", { uuid: article_uuid, isReadLater: is_read_later });
};

export const markAllRead = async (body: {
  uuid?: string;
  isToday?: boolean;
  isAll?: boolean;
}): Promise<number> => {
  return invoke("mark_all_read", {
    param: {
      uuid: body.uuid,
      is_today: body.isToday,
      is_all: body.isAll,
    },
  });
};

export const getUserConfig = async (): Promise<UserConfig> => {
  return invoke("get_user_config");
};

export const updateUserConfig = async (cfg: UserConfig): Promise<number> => {
  return invoke("update_user_config", { userCfg: cfg });
};

export const getArticleDetail = async (
  uuid: string,
): Promise<ArticleResItem> => {
  return invoke("get_article_detail", { uuid });
};

export const globalSearch = async (
  query: string,
  limit?: number,
): Promise<any[]> => {
  return invoke("global_search", { query, limit });
};

export interface OpmlImportResult {
  folder_count: number;
  feed_count: number;
  failed_count: number;
  errors: string[];
}

/**
 * 导出所有订阅为 OPML 格式
 *
 * @returns {Promise<string>} OPML 格式的订阅数据
 */
export const exportOpml = async (): Promise<string> => {
  return invoke("export_opml");
};

/**
 * 从 OPML 内容导入订阅
 *
 * @param {string} opmlContent - OPML 格式的订阅数据
 * @returns {Promise<OpmlImportResult>} 导入结果，包含文件夹数量、订阅数量、失败数量和错误信息
 */
export const importOpml = async (
  opmlContent: string,
): Promise<OpmlImportResult> => {
  return invoke("import_opml", { opmlContent });
};

export const importOpmlAsSource = async (
  opmlContent: string,
): Promise<OpmlImportResult> => {
  return invoke("import_opml_as_source", { opmlContent });
};
