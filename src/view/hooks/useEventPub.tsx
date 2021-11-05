import { ipcRenderer } from 'electron';
import { useMemo } from 'react';
import * as EventDict from '../../event/constant';

type EventName = keyof typeof EventDict;
type ListenerFn = (...args: any[]) => void;
type EventPubMap = Record<EventName, ListenerFn>;

export const useEventPub = () => {
  const emit = (name: string, params: any) => {
    ipcRenderer.send(name, params);
  };

  const on = (name: string, listener: ListenerFn) => {
    ipcRenderer.on(name, listener);
  };

  const eventPubEmit = useMemo((): EventPubMap => {
    return Object.keys(EventDict).reduce((acu, cur) => {
      acu[cur as EventName] = (args: any) => emit(cur, args);
      return acu;
    }, {} as EventPubMap);
  }, []);

  const eventPubOn = useMemo(() => {
    return Object.keys(EventDict).reduce((acu, cur) => {
      acu[cur as EventName] = (args: any) => on(cur, args);
      return acu;
    }, {} as EventPubMap);
  }, []);

  return { eventPubEmit, eventPubOn, emit, on };
};
