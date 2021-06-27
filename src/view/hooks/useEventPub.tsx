import { ipcRenderer } from 'electron';
import { useMemo } from 'react';
import * as EventDict from '../../event/constant';

type ListenerFn = (...args: any[]) => void;
type EventPubEmit = {
  [key: string]: (args: any) => void;
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
    };
  }, []);

  return { eventPubEmit, emit, on };
};
