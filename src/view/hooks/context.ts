import React from 'react';
import { Channel } from '../../infra/types';

export type ContextType = {
  currentChannel: Channel | null;
  currentChannelId: string;
};

const context: ContextType = {
  currentChannelId: '',
  currentChannel: null,
};

export const GlobalContext = React.createContext(context);
