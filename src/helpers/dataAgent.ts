import { invoke } from "@tauri-apps/api";

export const getChannels = async () => {
  return invoke('get_channels')
}

/**
 * 删除频道
 * @param {String} uuid  channel 的 uuid
 */
export const deleteChannel = async (uuid: string) => {
  return invoke('delete_channel', { uuid })
};

export const updateCountWithChannel = async (feedUrl: string): Promise<any> => {
  return {};
};

export const importChannels = async (list: string[]) => {
  invoke('import_channels', { list })
}

export const getArticleList = async (uuid: string) => {
  return invoke('get_articles', { uuid })
}

export const fetchFeed = async (url: string) => {
  return invoke('fetch_feed', { url })
}

export const addChannel = async (url: string) => {
  return invoke('add_channel', { url })
}

export const syncArticlesWithChannelUuid = async (uuid: string): Promise<number> => {
  return invoke('sync_articles_with_channel_uuid', { uuid })
}

export const getUnreadTotal = async () => {
  return invoke('get_unread_total')
}

export const updateArticleReadStatus = async (article_uuid: string, read_status: number) => {
  return invoke('update_article_read_status', {
    uuid: article_uuid,
    status: read_status,
  })
}
