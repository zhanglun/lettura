import React from 'react';
import { ChannelStore } from './channel';

export type StoreType = {
  channelStore: ChannelStore;
};

export const StoreContext = React.createContext<StoreType | null>(null);
export { ChannelStore };
