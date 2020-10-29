import React from 'react';
import { MobXProviderContext } from 'mobx-react';
import { ChannelStore } from './channel';

export const channelStore = new ChannelStore();

export const useMobxStore = (name: string) => {
  return React.useContext(MobXProviderContext)[name];
};
