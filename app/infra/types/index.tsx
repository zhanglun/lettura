export interface Channel {
  id: number;
  name: string;
  feedUrl: string;
  icon: string;
  category: string;
  tag: string;
  groupName: string;
  createTime: string;
}

export interface Article {
  channelId: number;
  title: string;
  url: string;
  content: string;
  isRead: number; // 1: 未读 2: 已读
  isLike: number; // 1: 默认。不收藏 2: 收藏
  pubTime: string;
}
