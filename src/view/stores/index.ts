import React from 'react';
import { ChannelStore } from './channel';
import { ArticleStore } from './article';

export type StoreType = {
  channelStore: ChannelStore;
  articleStore: ArticleStore;
};

export const StoreContext = React.createContext<StoreType | null>(null);
export { ChannelStore };
export { ArticleStore };
