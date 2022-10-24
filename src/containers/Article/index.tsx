import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleList, ArticleListRefType } from "../../components/ArticleList";
import { ArticleView } from "../../components/ArticleView";
import { Button, Dropdown } from "@douyinfe/semi-ui";
import * as dataAgent from "../../helpers/dataAgent";
import { useStore } from "../../hooks/useStore";
import styles from "./index.module.scss";
import {
  ArrowPathIcon,
  LinkIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { busChannel } from "../../helpers/busChannel";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const ArticleContainer = (): JSX.Element => {
  // @ts-ignore
  const params: { name: string } = useParams();
  const store = useStore();
  const query = useQuery();
  const feedUrl = query.get("feedUrl");
  const channelUuid = query.get("channelUuid");
  const [syncing, setSyncing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const articleListRef = useRef<ArticleListRefType>(null);

  const handleListScroll = useCallback(() => {
    if (listRef.current) {
      const scrollTop = listRef.current.scrollTop;

      if (scrollTop > 0) {
        listRef.current.classList.add("is-scroll");
      } else {
        listRef.current.classList.remove("is-scroll");
      }
    }
  }, []);

  const handleViewScroll = () => {
    if (viewRef.current) {
      const scrollTop = viewRef.current.scrollTop;
      console.log("scrolling", scrollTop);

      if (scrollTop > 0) {
        viewRef.current.classList.add("is-scroll");
      } else {
        viewRef.current.classList.remove("is-scroll");
      }
    }
  };

  useEffect(() => {
    if (listRef.current) {
      const $list = listRef.current as HTMLDivElement;
      $list.addEventListener("scroll", handleListScroll);
    }

    if (viewRef.current) {
      const $list = viewRef.current as HTMLDivElement;
      $list.addEventListener("scroll", handleViewScroll);
    }
  }, []);

  const getArticleList = () => {
    if (articleListRef.current) {
      articleListRef.current.getList();
    }
  };

  const syncArticles = () => {
    if (feedUrl) {
      setSyncing(true);

      dataAgent
        .syncArticlesWithChannelUuid(channelUuid as string)
        .then((res: number) => {
          console.log("%c Line:77 🥛 res", "color:#ea7e5c", res);
          getArticleList();
          setSyncing(false);
          busChannel.emit("updateChannelUnreadCount", {
            uuid: channelUuid as string,
            action: 'increase',
            count: res || 0,
          })
        });
    }
  };

  const handleRefresh = () => {
    syncArticles();
  };

  const markAllRead = () => {
    if (feedUrl && articleListRef.current) {
      articleListRef.current.markAllRead();
      // TODO
    }

    return Promise.resolve();
  };

  const changeFilter = (filter: any) => {
    store.setFilter(filter);
  };

  const resetScrollTop = () => {
    if (viewRef.current !== null) {
      viewRef.current.scroll(0, 0);
    }
  };

  useEffect(() => {
    resetScrollTop();
  }, [store.article]);

  useEffect(() => {
    resetScrollTop();
  }, []);

  useEffect(() => {
    if (listRef.current !== null) {
      listRef.current.scroll(0, 0);
    }
  }, [channelUuid]);

  return (
    <div className={styles.article}>
      <div className={styles.list} ref={listRef}>
        <div className={`sticky-header ${styles.header}`}>
          <div className={styles.title}>
            {store.channel ? store.channel.title : ""}
          </div>
          <div className={styles.menu}>
            <Dropdown
              trigger="click"
              position="bottomLeft"
              clickToHide={true}
              render={
                <Dropdown.Menu>
                  {store.filterList.map((item) => {
                    return (
                      <Dropdown.Item
                        key={item.id}
                        onClick={() => changeFilter(item)}
                        {...(item.id === store.currentFilter.id
                          ? { type: "primary" }
                          : {})}
                      >
                        {item.title}
                      </Dropdown.Item>
                    );
                  })}
                </Dropdown.Menu>
              }
            >
              <Button>{store.currentFilter.title}</Button>
            </Dropdown>
            <span className={styles.menuIcon} onClick={markAllRead}>
              <WalletIcon className={"h-4 w-4"} />
            </span>
            <span className={styles.menuIcon} onClick={handleRefresh}>
              <ArrowPathIcon
                className={`h-4 w-4 ${syncing ? "spinning" : ""}`}
              />
            </span>
          </div>
        </div>
        {syncing && <div className={styles.syncingBar}>同步中</div>}
        <ArticleList
          ref={articleListRef}
          title={params.name}
          channelUuid={channelUuid}
          feedUrl={feedUrl || ""}
        />
      </div>
      <div className={styles.mainView} ref={viewRef}>
        <div className={`sticky-header ${styles.viewHeader}`}>
          <div className={styles.viewMenu}>
            <a
              className={styles.menuIcon}
              target="_blank"
              rel="noreferrer"
              href={(store.article && store.article.link) as string}
            >
              <LinkIcon className={"h-4 w-4"} />
            </a>
          </div>
        </div>
        <ArticleView article={store.article} />
      </div>
    </div>
  );
};
