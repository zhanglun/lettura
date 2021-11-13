/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Dropdown } from '@douyinfe/semi-ui';
import { Icon } from '../Icon';
import { ArticleItem } from '../ArticleItem';
import { Loading } from '../Loading';
import { Article, Channel } from '../../../infra/types';
import { ArticleReadStatus } from '../../../infra/constants/status';
import { useDataProxy } from '../../hooks/useDataProxy';
import { useEventPub } from '../../hooks/useEventPub';
import { GlobalContext } from '../../hooks/context';

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
  const context = useContext(GlobalContext);
  const { currentChannel } = context;
  const { eventPubEmit, eventPubOn } = useEventPub();
  const [loading, setLoading] = useState(true);
  const [articleList, setArticleList] = useState<Article[]>([]);
  const articleListRef = useRef<HTMLDivElement>(null);
  const [listFilter, setListFilter] = useState<ListFilter>({
    unread: true,
  });
  const [syncing, setSyncing] = useState(false);

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

  const initial = useCallback((): Promise<any> => {
    if (!channelId) {
      return Promise.reject(new Error('-1'));
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
    }

    return promise
      .then((result: any) => {
        setArticleList(result);
        setLoading(false);

        return result;
      })
      .catch(() => {
        setLoading(false);
      });
  }, [channelId, listFilter]);

  /**
   * 判断是否需要同步
   * @param channel 频道信息
   */
  const checkSyncStatus = (channel: Channel | null) => {
    if (
      channel &&
      new Date(channel.lastSyncDate).getTime() <
        new Date().getTime() - 1000 * 10
    ) {
      console.log('===> 需要同步');
      return true;
    }

    console.log('===> 不需要同步');
    return false;
  };

  const syncArticles = useCallback(() => {
    setSyncing(true);

    dataProxy
      .PROXY_SYNC_ARTICLE_BY_CHANNEL({
        channelId,
      })
      .then((res) => {
        console.log(res);

        if (res.synced) {
          setArticleList((list) => {
            return res.result.concat(list);
          });
        }

        setSyncing(false);

        return res;
      })
      .catch(() => {
        setSyncing(false);
      });
  }, [currentChannel, channelId, articleList]);

  const handleRefresh = useCallback(() => {
    syncArticles();
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

  useEffect(() => {
    resetScrollTop();
  }, []);

  useEffect(() => {
    resetScrollTop();

    initial()
      .then(() => {
        if (checkSyncStatus(currentChannel)) {
          syncArticles();
        }

        return true;
      })
      .catch(() => {});
  }, [currentChannel, channelId]);

  // 筛选时只重新加载列表，不同步最新数据
  useEffect(() => {
    resetScrollTop();
    initial();
  }, [listFilter]);

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
        {syncing && <div className={styles.syncingBar}>同步中</div>}
        {loading ? (
          <Loading />
        ) : (
          <ul className={styles.list}>{renderList()}</ul>
        )}
      </div>
    </div>
  );
};
