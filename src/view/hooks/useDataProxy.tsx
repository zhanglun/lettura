import { useEffect } from 'react';
import {
  PROXY_GET_ARTICLE_LSIT,
  PROXY_GET_CHANNEL_LIST,
} from '../../event/constant';
import { useEventPub } from './useEventPub';

export const useDataProxy = () => {
  const { emit, on } = useEventPub();
  const proxy = (name: string, data?: any) => {
    return new Promise((resolve, reject) => {
      on(name, (_event, result) => {
        return resolve(result);
      });

      emit(name, data);
    });
  };

  useEffect(() => {});

  function getChannelList(): Promise<any> {
    return proxy(PROXY_GET_CHANNEL_LIST);
  }

  function getArticleList(): Promise<any> {
    return proxy(PROXY_GET_ARTICLE_LSIT);
  }

  return {
    getChannelList,
    getArticleList,
  };
};
