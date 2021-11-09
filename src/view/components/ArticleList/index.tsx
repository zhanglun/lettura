/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dropdown } from '@douyinfe/semi-ui';
import { Icon } from '../Icon';
import { ArticleItem } from '../ArticleItem';
import { Loading } from '../Loading';
import { Article } from '../../../infra/types';
import { ArticleReadStatus } from '../../../infra/constants/status';
import { useDataProxy } from '../../hooks/useDataProxy';
import { useEventPub } from '../../hooks/useEventPub';

import styles from './articlelist.css';

type ListFilter = {
  all?: boolean;
  unread?: boolean;
  read?: boolean;
};

type ArticleListProps = {
  channelId: string | null;
  title: string;
  onArticleSelect: (article: Article) => void;
};

export const ArticleList = (props: ArticleListProps): JSX.Element => {
  const { channelId, title } = props;
  const dataProxy = useDataProxy();
  const { eventPubEmit, eventPubOn } = useEventPub();
  const [loading, setLoading] = useState(true);
  const [articleList, setArticleList] = useState<Article[]>([]);
  const articleListRef = useRef<HTMLDivElement>(null);
  const [listFilter, setListFilter] = useState<ListFilter>({
    unread: true,
  });

  const resetScrollTop = () => {
    if (articleListRef.current !== null) {
      articleListRef.current.scroll(0, 0);
    }
  };

  const handleArticleSelect = (article: Article) => {
    if (props.onArticleSelect) {
      props.onArticleSelect(article);
    }
  };

  const renderList = useCallback((): JSX.Element[] => {
    return articleList.map((article: Article) => {
      return (
        <ArticleItem
          article={article}
          key={article.id}
          onSelect={handleArticleSelect}
        />
      );
    });
  }, [articleList]);

  const handleRefresh = useCallback(() => {
    eventPubEmit.MANUAL_SYNC_UNREAD_WITH_CHANNEL_ID({ channelId });
  }, [channelId, eventPubEmit]);

  const showAll = useCallback(() => {
    const filter = {
      all: true,
      unread: false,
    };

    setListFilter(filter);
  }, []);

  const showUnread = useCallback(() => {
    const filter = {
      all: false,
      unread: true,
    };

    setListFilter(filter);
  }, []);

  const showRead = useCallback(() => {
    const filter = {
      all: false,
      unread: false,
      read: true,
    };

    setListFilter(filter);
  }, []);

  const markAllRead = useCallback(() => {
    const filter = {
      all: false,
      unread: true,
    };

    setListFilter(filter);
    eventPubEmit.MARK_ARTICLE_READ_BY_CHANNEL({ channelId });
  }, [channelId, eventPubEmit]);

  const initial = useCallback(() => {
    if (!channelId) {
      return;
    }

    setLoading(true);

    let promise = Promise.resolve();
    const params: { readStatus?: ArticleReadStatus; channelId?: string } = {};

    if (listFilter.unread) {
      params.readStatus = ArticleReadStatus.unRead;
    }

    if (listFilter.read) {
      params.readStatus = ArticleReadStatus.isRead;
    }

    if (channelId === 'inbox' || channelId === 'today') {
      promise = dataProxy.PROXY_GET_ARTICLE_LSIT(params);
    } else {
      promise = dataProxy.PROXY_GET_ARTICLE_LIST_IN_CHANNEL({
        channelId,
        ...params,
      });
      // promise = dataProxy.MANUAL_SYNC_UNREAD_WITH_CHANNEL_ID({
      //   channelId,
      //   ...params,
      // });
    }

    promise
      .then((result: any) => {
        setArticleList(result);
        setLoading(false);
        return result;
      })
      .catch((err) => {
        setLoading(false);
      });
  }, [channelId, listFilter]);

  useEffect(() => {
    resetScrollTop();
    initial();
  }, [channelId, listFilter]);

  useEffect(() => {
    eventPubOn.MARK_ARTICLE_READ_BY_CHANNEL(() => {
      handleRefresh();
    });
  }, [eventPubOn, handleRefresh]);

  return (
    <div className={styles.container} ref={articleListRef}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <div className={styles.menu}>
          <Icon
            customClass={styles.menuIcon}
            name="checklist"
            onClick={markAllRead}
          />
          <Icon
            customClass={styles.menuIcon}
            name="refresh"
            onClick={handleRefresh}
          />
          <Dropdown
            clickToHide
            trigger="click"
            position="bottomRight"
            render={
              <Dropdown.Menu>
                <Dropdown.Item active={listFilter.unread}>
                  <span
                    className={`${listFilter.unread && styles.active}`}
                    onClick={showUnread}
                  >
                    未读文章
                  </span>
                </Dropdown.Item>
                <Dropdown.Item active={listFilter.read}>
                  <span
                    className={`${listFilter.read && styles.active}`}
                    onClick={showRead}
                  >
                    已读文章
                  </span>
                </Dropdown.Item>
                <Dropdown.Item active={listFilter.all}>
                  <span
                    className={`${listFilter.all && styles.active}`}
                    onClick={showAll}
                  >
                    全部文章
                  </span>
                </Dropdown.Item>
              </Dropdown.Menu>
            }
          >
            <span>
              <Icon customClass={styles.menuIcon} name="filter_alt" />
            </span>
          </Dropdown>
        </div>
      </div>
      <div className={styles.inner}>
        {loading ? (
          <Loading />
        ) : (
          <ul className={styles.list}>{renderList()}</ul>
        )}
      </div>
    </div>
  );
};
