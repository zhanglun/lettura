import { invoke } from "@tauri-apps/api/core";
import {
  Article,
  ArticleResItem,
  Channel,
  FeedResItem,
  FolderResItem,
} from "../db";
import { request } from "@/helpers/request";
import { AxiosRequestConfig, AxiosResponse } from "axios";

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
export const deleteChannel = async (uuid: string) => {
  return request.delete(`feeds/${uuid}`);
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

export const fetchFeed = async (url: string): Promise<[any, string]> => {
  return invoke("fetch_feed", { url });
};

export const subscribeFeed = async (
  url: string,
): Promise<[FeedResItem, number, string]> => {
  return invoke("add_feed", { url });
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

export const updateTheme = async (theme: string): Promise<any> => {
  return invoke("update_theme", { theme });
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

export interface StarterPackSummary {
  id: string;
  name: string;
  description: string;
  icon: string;
  language: string;
  tags: string[];
  source_count: number;
}

export interface PackPreview {
  id: string;
  name: string;
  description: string;
  icon: string;
  language: string;
  tags: string[];
  sources: { feed_url: string; title: string; site_url: string; language: string }[];
}

export interface PackInstallResult {
  installed_feeds: number;
  installed_sources: number;
  sync_started: boolean;
}

export const getStarterPacks = async (): Promise<StarterPackSummary[]> => {
  return invoke("get_starter_packs");
};

export const previewPack = async (packId: string): Promise<PackPreview> => {
  return invoke("preview_pack", { packId });
};

export const installPack = async (
  packIds: string[],
): Promise<PackInstallResult> => {
  return invoke("install_pack", { packIds });
};

export const importOpmlAsSource = async (
  opmlContent: string,
): Promise<OpmlImportResult> => {
  return invoke("import_opml_as_source", { opmlContent });
};

export interface SignalSource {
  article_id: number;
  title: string;
  link: string;
  feed_title: string;
  feed_uuid: string;
  pub_date: string;
  excerpt: string | null;
}

export interface Signal {
  id: number;
  title: string;
  summary: string;
  relevance_score: number;
  source_count: number;
  sources: SignalSource[];
  topic_id: number | null;
  topic_title: string | null;
  created_at: string;
}

export interface AIConfigPublic {
  has_api_key: boolean;
  model: string;
  embedding_model: string;
  base_url: string;
}

export interface ValidateAIConfigResult {
  valid: boolean;
  message: string;
}

export interface PipelineResult {
  run_id: number;
  started: boolean;
}

export const getTodaySignals = async (limit?: number): Promise<Signal[]> => {
  return invoke("get_today_signals", { limit });
};

export const getAIConfig = async (): Promise<AIConfigPublic> => {
  return invoke("get_ai_config");
};

export const saveAIConfig = async (config: {
  apiKey: string;
  model: string;
  embeddingModel: string;
  baseUrl: string;
  pipelineIntervalHours?: number;
}): Promise<void> => {
  return invoke("save_ai_config", {
    apiKey: config.apiKey,
    model: config.model,
    embeddingModel: config.embeddingModel,
    baseUrl: config.baseUrl,
    pipelineIntervalHours: config.pipelineIntervalHours,
  });
};

export const validateAIConfig = async (): Promise<ValidateAIConfigResult> => {
  return invoke("validate_ai_config");
};

export const triggerPipeline = async (
  runType?: string,
): Promise<PipelineResult> => {
  return invoke("trigger_pipeline", { runType });
};
