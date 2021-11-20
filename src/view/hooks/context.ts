import React from 'react';
import { Channel } from '../../infra/types';

export type ContextType = {
  currentChannel: Channel | null;
  currentChannelId: string;
  syncingChannelUnreadCount: boolean;
};

export const defaultContext: ContextType = {
  currentChannelId: '',
  currentChannel: null,
  syncingChannelUnreadCount: false,
};

export const GlobalContext = React.createContext(defaultContext);
