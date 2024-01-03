import { invoke } from "@tauri-apps/api";
import { Article, ArticleResItem, Channel, FeedResItem, Folder } from "../db";
import { request } from "@/helpers/request";
import { AxiosRequestConfig, AxiosResponse } from "axios";

export const getChannels = async (
  filter: any
): Promise<AxiosResponse<{ list: (Channel & { parent_uuid: String })[] }>> => {
  return request.get("feeds", {
    params: {
      filter,
    },
  });
};

export const getFeeds = async (): Promise<AxiosResponse<FeedResItem[]>> => {
  return request.get("subscribes");
};

export const createFolder = async (name: string): Promise<number> => {
  return invoke("create_folder", { name });
};

export const updateFolder = async (
  uuid: string,
  name: string
): Promise<number> => {
  return invoke("update_folder", { uuid, name });
};

export const getFolders = async (): Promise<Folder[]> => {
  return invoke("get_folders");
};

export const updateFeedSort = async (
  sorts: {
    item_type: string;
    uuid: string;
    folder_uuid: string;
    sort: number;
  }[]
): Promise<any> => {
  return request.post("update-feed-sort", sorts);
};

export const moveChannelIntoFolder = async (
  channelUuid: string,
  folderUuid: string,
  sort: number
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

export const getArticleList = async (
  filter: any
) => {
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

export const addChannel = async (url: string): Promise<[FeedResItem, number, string]> => {
  return invoke("add_feed", { url });
};

export const syncFeed = async (
  feed_type: string,
  uuid: string
): Promise<AxiosResponse<{[key: string]: [string, number, string]}>> => {
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
  read_status: number
) => {
  return request.post(`/articles/${article_uuid}/read`, {
    read_status
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
  return request.post("/user-config", cfg)
};

export const updateProxy = async (cfg: LocalProxy): Promise<any> => {
  return invoke("update_proxy", {
    ip: cfg.ip,
    port: cfg.port,
  });
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
  config: AxiosRequestConfig
): Promise<AxiosResponse<ArticleResItem>> => {
  return request.get(`articles/${uuid}`, config);
};

export const getBestImage = async (
  url: String
): Promise<AxiosResponse<string>> => {
  return request.get(`image-proxy`, {
    params: {
      url,
    },
  });
};

export const getPageSources = async (
  url: string
): Promise<AxiosResponse<string>> => {
  return request.get(`article-proxy`, {
    params: {
      url,
    },
  });
};

export const updateIcon = async (
  uuid: String,
  url: string
): Promise<string> => {
  return invoke("update_icon", { uuid, url });
};
