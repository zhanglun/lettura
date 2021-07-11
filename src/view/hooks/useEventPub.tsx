import { ipcRenderer } from 'electron';
import { useMemo } from 'react';
import * as EventDict from '../../event/constant';

type ListenerFn = (...args: any[]) => void;
type EventPubEmit = {
  subscribe: ListenerFn;
  importOPML: ListenerFn;
  exportOPML: ListenerFn;
};

export const useEventPub = () => {
  const emit = (name: string, params: any) => {
    ipcRenderer.send(name, params);
  };

  const on = (name: string, listener: ListenerFn) => {
    ipcRenderer.on(name, listener);
  };

  const eventPubEmit: EventPubEmit = useMemo(() => {
    return {
      subscribe: (args: any) => emit(EventDict.SUBSCRIBE, args),
      importOPML: (args: any) => emit(EventDict.IMPORT_OPML, args),
      exportOPML: (args: any) => emit(EventDict.EXPORT_OPML, args),
    };
  }, []);

  return { eventPubEmit, emit, on };
};
