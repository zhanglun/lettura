import { invoke } from "@tauri-apps/api";
import { Channel } from "../db";

export const getChannels = async (
  filter: any
): Promise<{ list: Channel[] }> => {
  return invoke("get_channels", { filter });
};

export const getFeeds = async (): Promise<Channel[]> => {
  return invoke("get_feeds");
};

export const createFolder = async (name: string): Promise<number> => {
  return invoke("create_folder", { name });
};

export const updateFeedSort = async (
  sorts: { uuid: string; sort: number, item_type: string }[]
): Promise<any> => {
  return invoke("update_feed_sort", { sorts });
};

export const moveChannelIntoFolder = async (channelUuid: string, folderUuid: string, sort: number): Promise<any> => {
  return invoke("move_channel_into_folder", {
    channelUuid,
    folderUuid,
    sort
  })
}

/**
 * 删除频道
 * @param {String} uuid  channel 的 uuid
 */
export const deleteChannel = async (uuid: string) => {
  return invoke("delete_channel", { uuid });
};

export const updateCountWithChannel = async (feedUrl: string): Promise<any> => {
  return {};
};

export const importChannels = async (list: string[]) => {
  return invoke("import_channels", { list });
};

export const getArticleList = async (uuid: string, filter: any) => {
  return invoke("get_articles", { uuid, filter });
};

export const fetchFeed = async (
  url: string
): Promise<{ Atom?: any; RSS?: any }> => {
  return invoke("fetch_feed", { url });
};

export const addChannel = async (url: string): Promise<number> => {
  return invoke("add_channel", { url });
};

export const syncArticlesWithChannelUuid = async (
  uuid: string
): Promise<number> => {
  return invoke("sync_articles_with_channel_uuid", { uuid });
};

export const getUnreadTotal = async (): Promise<{ [key: string]: number }> => {
  return invoke("get_unread_total");
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
