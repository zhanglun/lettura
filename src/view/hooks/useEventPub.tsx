import { ipcRenderer } from 'electron';
import { useMemo } from 'react';
import * as EventDict from '../../event/constant';

// type a = keyof typeof EventDict;
type ListenerFn = (...args: any[]) => void;
type EventPubMap = {
  // subscribe: ListenerFn;
  // importOPML: ListenerFn;
  // exportOPML: ListenerFn;
  // MANUAL_SYNC_UNREAD_WITH_CHANNEL_ID: ListenerFn;
  // MARK_ARTICLE_READ_BY_CHANNEL: ListenerFn;
  [key: string]: ListenerFn;
};

export const useEventPub = () => {
  const emit = (name: string, params: any) => {
    ipcRenderer.send(name, params);
  };

  const on = (name: string, listener: ListenerFn) => {
    ipcRenderer.on(name, listener);
  };

  const eventPubEmit: EventPubMap = useMemo(() => {
    // return {
    //   subscribe: (args: any) => emit(EventDict.SUBSCRIBE, args),
    //   importOPML: (args: any) => emit(EventDict.IMPORT_OPML, args),
    //   exportOPML: (args: any) => emit(EventDict.EXPORT_OPML, args),
    //   MANUAL_SYNC_UNREAD_WITH_CHANNEL_ID: (args: any) =>
    //     emit(EventDict.MANUAL_SYNC_UNREAD_WITH_CHANNEL_ID, args),
    //   MARK_ARTICLE_READ_BY_CHANNEL: (args: any) =>
    //     emit(EventDict.MARK_ARTICLE_READ_BY_CHANNEL, args),
    // };
    return Object.keys(EventDict).reduce((acu: EventPubMap, cur) => {
      acu[cur] = (args: any) => emit(cur, args);
      return acu;
    }, {});
  }, []);

  const eventPubOn = useMemo(() => {
    return Object.keys(EventDict).reduce((acu: EventPubMap, cur) => {
      acu[cur] = (args: any) => on(cur, args);
      return acu;
    }, {});
  }, []);

  return { eventPubEmit, eventPubOn, emit, on };
};
