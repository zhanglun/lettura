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
  return request.delete(`feeds/${uuid}`)
};

export const deleteFolder = async (uuid: string) => {
  return invoke("delete_folder", { uuid });
};

export const updateCountWithChannel = async (feedUrl: string): Promise<any> => {
  return {};
};

export const importChannels = async (list: string[]) => {
  return invoke("import_channels", { list });
};

export const getArticleList = async (uuid: string | undefined, type: string | null, filter: any) => {
  console.log("ppp: %o", {
    params: {
      uuid,
      ...filter,
      type,
    },
  });
  const req = request.get("articles", {
    params: {
      channel_uuid: uuid,
      ...filter,
      item_type: type
    },
  });

  console.log(req);
  return req;
};

export const getTodayArticleList = async (filter: any) => {
  console.warn("%c Line:70 🥔 get_today_articles", "color:#7f2b82");
  return invoke("get_today_articles", { filter });
};

export const getAllArticleList = async (filter: any) => {
  console.warn("%c Line:74 🍬 getAllArticleList", "color:#93c0a4");
  return invoke("get_all_articles", { filter });
};

export const fetchFeed = async (url: string): Promise<[any, string]> => {
  return invoke("fetch_feed", { url });
};

export const addChannel = async (url: string): Promise<[number, string]> => {
  return invoke("add_feed", { url });
};

export const syncFeed = async (
  feed_type: string,
  uuid: string
): Promise<AxiosResponse<[[number, string, string]]>> => {
  return request.get(`/feeds/${uuid}/sync`, {
    params: {
      feed_type,
    },
  });
  // return invoke("sync_articles_with_channel_uuid", { feedType, uuid });
};

export const getUnreadTotal = async (): Promise<{ [key: string]: number }> => {
  return invoke("get_unread_total");
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
  return invoke("update_article_read_status", {
    uuid: article_uuid,
    status: read_status,
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
  return invoke("get_user_config");
};

export const updateUserConfig = async (cfg: any): Promise<any> => {
  return invoke("update_user_config", {
    userCfg: cfg,
  });
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

export const getPageSources = async (url: string): Promise<AxiosResponse<string>> => {
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
