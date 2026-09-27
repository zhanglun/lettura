import { invoke } from "@tauri-apps/api/core";
import {
  Article,
  ArticleResItem,
  Channel,
  FeedResItem,
  FolderResItem,
  SiteRuleSummary,
  SourceAccount,
} from "../db";
import { request } from "@/helpers/request";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import type {
} from "@/typing";

export const getChannels = async (
  filter: any,
): Promise<AxiosResponse<{ list: (Channel & { parent_uuid: String })[] }>> => {
  return request.get("feeds", {
    params: {
      filter,
    },
  });
};

export const getSubscribes = async (): Promise<
  AxiosResponse<FeedResItem[]>
> => {
  return request.get("subscribes");
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

export const getFolders = async (): Promise<AxiosResponse<FolderResItem[]>> => {
  return request.get("folders", {});
};

export const updateFeedSort = async (
  sorts: {
    item_type: string;
    uuid: string;
    folder_uuid: string;
    sort: number;
  }[],
): Promise<any> => {
  return request.post("update-feed-sort", sorts);
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
 * 删除频道
 * @param {String} uuid  channel 的 uuid
 */
export const deleteChannel = async (uuid: string, deleteArticles: boolean = false) => {
  return request.delete(`feeds/${uuid}`, {
    params: { delete_articles: deleteArticles },
  });
};

export const deleteFolder = async (uuid: string) => {
  return invoke("delete_folder", { uuid });
};

export const getArticleList = async (filter: any) => {
  const req = request.get("articles", {
    params: {
      ...filter,
    },
  });

  return req;
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
): Promise<AxiosResponse<{ [key: string]: [string, number, string] }>> => {
  return request.get(`/feeds/${uuid}/sync`, {
    params: {
      feed_type,
    },
  });
};

export const getUnreadTotal = async (): Promise<
  AxiosResponse<{ [key: string]: number }>
> => {
  return request.get("unread-total");
};

export const getCollectionMetas = async (): Promise<
  AxiosResponse<{
    [key: string]: number;
  }>
> => {
  return request.get("collection-metas");
};

export const updateArticleReadStatus = async (
  article_uuid: string,
  read_status: number,
) => {
  return request.post(`/articles/${article_uuid}/read`, {
    read_status,
  });
};

export const updateArticleStarStatus = async (
  article_uuid: string,
  star_status: number,
) => {
  return request.post(`/articles/${article_uuid}/star`, {
    starred: star_status,
  });
};

export const updateArticleReadLaterStatus = async (
  article_uuid: string,
  is_read_later: number,
) => {
  return request.post(`/articles/${article_uuid}/read-later`, {
    is_read_later,
  });
};

export const markAllRead = async (body: {
  uuid?: string;
  isToday?: boolean;
  isAll?: boolean;
}): Promise<AxiosResponse<number>> => {
  return request.post("/mark-all-as-read", body);
};

export const getUserConfig = async (): Promise<any> => {
  return request.get("/user-config");
};

export const updateUserConfig = async (cfg: any): Promise<any> => {
  return request.post("/user-config", cfg);
};

export const updateThreads = async (threads: number): Promise<any> => {
  return invoke("update_threads", { threads });
};

export const updateInterval = async (interval: number): Promise<any> => {
  return invoke("update_interval", { interval });
};

export const initProcess = async (): Promise<any> => {
  return invoke("init_process", {});
};

export const getArticleDetail = async (
  uuid: string,
  config: AxiosRequestConfig,
): Promise<AxiosResponse<ArticleResItem>> => {
  return request.get(`articles/${uuid}`, config);
};

export const getBestImage = async (
  url: String,
): Promise<AxiosResponse<string>> => {
  return request.get("image-proxy", {
    params: {
      url,
    },
  });
};

export const getPageSources = async (
  url: string,
): Promise<AxiosResponse<string>> => {
  return request.get("article-proxy", {
    params: {
      url,
    },
  });
};

export const updateIcon = async (
  uuid: String,
  url: string,
): Promise<string> => {
  return invoke("update_icon", { uuid, url });
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
