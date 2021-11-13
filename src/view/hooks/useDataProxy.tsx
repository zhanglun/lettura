/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/naming-convention */
import { useMemo } from 'react';
import * as EventDict from '../../event/constant';
import { ArticleReadStatus } from '../../infra/constants/status';
import { useEventPub } from './useEventPub';

type EventName = keyof typeof EventDict;
type ListenerFn = (...args: any[]) => Promise<any>;
type EventPubMap = Record<EventName, ListenerFn>;

export const useDataProxy = () => {
  const { emit, on } = useEventPub();
  const proxy = (name: string, data?: any): any => {
    return new Promise((resolve) => {
      on(name, (_event, result) => {
        return resolve(result);
      });

      emit(name, data);
    });
  };

  // function getChannelList(): Promise<any> {
  //   return proxy(PROXY_GET_CHANNEL_LIST);
  // }
  function PROXY_GET_ARTICLE_LIST_IN_CHANNEL(params: {
    readStatus?: ArticleReadStatus;
    channelId: string;
  }) {
    return proxy(EventDict.PROXY_GET_ARTICLE_LIST_IN_CHANNEL, params);
  }

  // function getArticleList(params: any): Promise<any> {
  //   return proxy(PROXY_GET_ARTICLE_LSIT, params);
  // }

  // function getArticleListInChannel(params: any): Promise<any> {
  //   return proxy(PROXY_GET_ARTICLE_LIST_IN_CHANNEL, params);
  // }

  // function syncArticlesInCurrentChannel(params: {
  //   channelId: string;
  //   readStatus?: ArticleReadStatus;
  // }): Promise<any> {
  //   return proxy(MANUAL_SYNC_UNREAD_WITH_CHANNEL_ID, params);
  // }

  // function markAsRead(article: Article): Promise<boolean> {
  //   return proxy(MARK_ARTICLE_READ, article);
  // }

  const dataProxy = useMemo(() => {
    return Object.keys(EventDict).reduce((acu, cur) => {
      acu[cur as EventName] = (args: any) => proxy(cur, args);
      return acu;
    }, {} as EventPubMap);
  }, []);

  return {
    ...dataProxy,
    PROXY_GET_ARTICLE_LIST_IN_CHANNEL,
  };

  // return {
  //   getChannelList,
  //   getArticleList,
  //   getArticleListInChannel,

  //   syncArticlesInCurrentChannel,
  //   markAsRead,
  //   PROXY_GET_UNREAD_TOTAL: (): Promise<any> => proxy(PROXY_GET_UNREAD_TOTAL),
  // };
};
