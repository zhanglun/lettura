import { invoke } from "@tauri-apps/api";
import { Article, Channel, Folder } from "../db";

export const getChannels = async (
  filter: any,
): Promise<{ list: (Channel & { parent_uuid: String })[] }> => {
  return invoke("get_channels", { filter });
};

export const getFeeds = async (): Promise<Channel[]> => {
  return invoke("get_feeds");
};

export const createFolder = async (name: string): Promise<number> => {
  return invoke("create_folder", { name });
};

export const updateFolder = async (uuid: string, name: string): Promise<number> => {
  return invoke("update_folder", { uuid, name });
};

export const getFolders = async (): Promise<Folder[]> => {
  return invoke("get_folders");
};

export const updateFeedSort = async (
  sorts: { item_type: string; parent_uuid: string; child_uuid: string, sort: number }[],
): Promise<any> => {
  return invoke("update_feed_sort", { sorts });
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
  return invoke("delete_feed", { uuid });
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

export const getArticleList = async (uuid: string | undefined, filter: any) => {
  return invoke("get_articles", { uuid, filter });
};

export const fetchFeed = async (
  url: string,
): Promise<[any, string]> => {
  return invoke("fetch_feed", { url });
};

export const addChannel = async (url: string): Promise<[number, string]> => {
  return invoke("add_feed", { url });
};

export const syncArticlesWithChannelUuid = async (
  feedType: string,
  uuid: string,
): Promise<[[number, string, string]]> => {
  return invoke("sync_articles_with_channel_uuid", { feedType, uuid });
};

export const getUnreadTotal = async (): Promise<{ [key: string]: number }> => {
  return invoke("get_unread_total");
};

export const updateArticleReadStatus = async (
  article_uuid: string,
  read_status: number,
) => {
  return invoke("update_article_read_status", {
    uuid: article_uuid,
    status: read_status,
  });
};

export const markAllRead = async (uuid: string) => {
  return invoke("mark_all_read", {
    channelUuid: uuid,
  });
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

export const getArticleDetail = async (uuid: string): Promise<Article> => {
  return invoke("get_article_detail", { uuid })
}

export const getBestImage = async (url: String): Promise<string> => {
  return invoke("get_web_best_image", { url })
}

export const getPageSources = async (url: string): Promise<string> => {
  return invoke("get_web_source", { url })
}

export const updateIcon = async (uuid: String, url: string): Promise<string> => {
  return invoke("update_icon", { uuid, url })
}
