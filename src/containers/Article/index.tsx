import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleList, ArticleListRefType } from "../../components/ArticleList";
import { ArticleView } from "../../components/ArticleView";
import { Button, Dropdown, Menu, Message } from "@arco-design/web-react";
import * as dataAgent from "../../helpers/dataAgent";
import { useBearStore } from "../../hooks/useBearStore";
import styles from "./index.module.scss";
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  GlobeAltIcon,
  LinkIcon,
  PaintBrushIcon,
} from "@heroicons/react/24/outline";
import { Filter, CheckCheck, RefreshCw } from "lucide-react";
import { busChannel } from "../../helpers/busChannel";
import { Article } from "../../db";
import { CustomizeStyle } from "@/components/SettingPanel/CustomizeStyle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const ArticleContainer = (): JSX.Element => {
  // @ts-ignore
  const params: { name: string } = useParams();
  const store = useBearStore((state) => ({
    article: state.article,
    articleList: state.articleList,
    setArticle: state.setArticle,
    updateArticleAndIdx: state.updateArticleAndIdx,
    channel: state.channel,

    filterList: state.filterList,
    currentFilter: state.currentFilter,
    setFilter: state.setFilter,

    currentIdx: state.currentIdx,
    setCurrentIdx: state.setCurrentIdx,
    userConfig: state.userConfig,
  }));

  console.log(store.currentFilter);

  const query = useQuery();
  const feedUrl = query.get("feedUrl");
  const type = query.get("type");
  const channelUuid = query.get("channelUuid");
  const [syncing, setSyncing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const articleListRef = useRef<ArticleListRefType>(null);
  const { currentIdx, setCurrentIdx } = store;

  const handleViewScroll = () => {
    if (viewRef.current) {
      const scrollTop = viewRef.current.scrollTop;
      console.log("scrolling", scrollTop);

      if (scrollTop > 0) {
        viewRef.current?.parentElement?.classList.add("is-scroll");
      } else {
        viewRef.current?.parentElement?.classList.remove("is-scroll");
      }
    }
  };

  useEffect(() => {
    if (viewRef.current) {
      const $list = viewRef.current as HTMLDivElement;
      $list.addEventListener("scroll", handleViewScroll);
    }
  }, [store.articleList]);

  useEffect(() => {
    if (
      listRef.current &&
      articleListRef.current &&
      Object.keys(articleListRef.current.articlesRef).length > 0
    ) {
      const $rootElem = listRef.current as HTMLDivElement;

      const options = {
        root: $rootElem,
        rootMargin: "0px",
        threshold: 1,
      };

      const callback = (
        entries: IntersectionObserverEntry[],
        observer: IntersectionObserver
      ) => {
        if (entries[0].intersectionRatio < 1) {
          listRef.current?.parentElement?.classList.add("is-scroll");
        } else {
          listRef.current?.parentElement?.classList.remove("is-scroll");
        }
      };

      const observer = new IntersectionObserver(callback, options);
      const $target = (
        Object.values(articleListRef.current.articlesRef as any)[0] as any
      ).current;

      if ($target) {
        observer.observe($target);
      }
    }
  }, [articleListRef.current]);

  const getArticleList = () => {
    if (articleListRef.current) {
      articleListRef.current.getList();
    }
  };

  const syncArticles = () => {
    if (channelUuid) {
      setSyncing(true);

      dataAgent
        .syncArticlesWithChannelUuid(
          store.channel?.item_type as string,
          channelUuid as string
        )
        .then((res) => {
          const [num, message] = res;

          console.log("%c Line:77 🥛 res", "color:#ea7e5c", res);

          if (message) {
            Message.warning({
              content: (
                <>
                  <div>Something wrong!</div>
                  <p>{message}</p>
                </>
              ),
              duration: 4,
              closable: false,
            });
          } else {
            getArticleList();
            busChannel.emit("updateChannelUnreadCount", {
              uuid: channelUuid as string,
              action: "increase",
              count: num || 0,
            });
          }
        })
        .finally(() => {
          setSyncing(false);
        });
    }
  };

  const handleViewSourcePage = () => {
    const { link } = store.article as Article;

    dataAgent.getPageSources(link).then((res) => {
      console.log(res);
    });
    // TODO: parse web content
  };

  const handleCopyLink = () => {
    const { link } = store.article as Article;

    navigator.clipboard.writeText(link).then(
      function () {
        Message.success({
          content: "Copied!",
          duration: 2,
          closable: false,
        });
      },
      function (err) {
        console.error("Async: Could not copy text: ", err);
      }
    );
  };

  const handleRefresh = () => {
    syncArticles();
  };

  const markAllRead = () => {
    if (feedUrl && articleListRef.current) {
      console.log("🚀 ~ file: index.tsx:148 ~ markAllRead ~ feedUrl", feedUrl);
      articleListRef.current.markAllRead();
      // TODO
    }

    return Promise.resolve();
  };

  const changeFilter = (id: any) => {
    if (store.filterList.some(_ => _.id === id)) {
      store.setFilter({...store.filterList.filter(_ => _.id === id)[0]});
    }
  };

  const resetScrollTop = () => {
    if (viewRef.current !== null) {
      viewRef.current.scroll(0, 0);
    }
  };

  const handleViewPrevious = () => {
    let cur = -1;

    if (currentIdx <= 0) {
      cur = 0;
    } else {
      cur = currentIdx - 1;
    }

    calculateItemPosition("up", store.articleList[cur] || null);

    store.updateArticleAndIdx(store.articleList[cur] || null, cur);
  };

  const handleViewNext = () => {
    let cur = -1;

    if (currentIdx < store.articleList.length - 1) {
      cur = currentIdx + 1;

      calculateItemPosition("down", store.articleList[cur] || null);

      store.updateArticleAndIdx(store.articleList[cur] || null, cur);
    }
  };

  useEffect(() => {
    const unsub2 = useBearStore.subscribe(
      (state) => state.currentIdx,
      (idx, previousIdx) => {
        if (idx <= previousIdx) {
          calculateItemPosition("up", store.articleList[idx]);
        } else {
          console.log("往下", store.articleList[idx]);
          calculateItemPosition("down", store.articleList[idx]);
        }
      }
    );

    return () => {
      console.log("clean!!!!");
      unsub2();
    };
  }, [store.articleList]);

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

    setCurrentIdx(-1);
  }, [channelUuid]);

  function calculateItemPosition(
    direction: "up" | "down",
    article: Article | null
  ) {
    if (!article || !article.uuid) {
      return;
    }

    const $li = document.getElementById(article.uuid);
    const bounding = $li?.getBoundingClientRect();
    const winH = window.innerHeight;

    if (
      (direction === "up" || direction === "down") &&
      bounding &&
      bounding.top < 58
    ) {
      const offset = 58 - bounding.top;
      const scrollTop = (listRef?.current?.scrollTop || 0) - offset;

      listRef?.current?.scrollTo(0, scrollTop);
    } else if (
      (direction === "up" || direction === "down") &&
      bounding &&
      bounding.bottom > winH
    ) {
      const offset = bounding.bottom - winH;
      const scrollTop = (listRef?.current?.scrollTop || 0) + offset;

      console.log(
        "🚀 ~ file: index.tsx:324 ~ ArticleContainer ~ scrollTop:",
        scrollTop
      );
      listRef?.current?.scrollTo(0, scrollTop);
    }
  }

  return (
    <div className={styles.article}>
      <div className="relative h-full border-r border-stone-100 bg-article-list-bg">
        <div className={`sticky-header ${styles.header}`}>
          <div
            className="
            flex
            items-center
            px-3
            text-sm
            font-bold
            w-full
            text-ellipsis
            overflow-hidden
            whitespace-nowrap
            text-article-headline
          "
          >
            {store.channel ? store.channel.title : ""}
          </div>
          <div className={styles.menu}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span className={styles.menuIcon}>
                  <Filter size={16}></Filter>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-detail-bg">
                <DropdownMenuRadioGroup
                  value={store.currentFilter.id}
                  onValueChange={changeFilter}
                >
                  {store.filterList.map((item) => {
                    return (
                      <DropdownMenuRadioItem key={item.id + ""} value={item.id}>
                        {item.title}
                      </DropdownMenuRadioItem>
                    );
                  })}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* <Dropdown
              trigger="click"
              position="bl"
              droplist={
                <Menu>
                  {store.filterList.map((item) => {
                    return (
                      <Menu.Item
                        key={item.id + ""}
                        onClick={() => changeFilter(item)}
                        {...(item.id === store.currentFilter.id
                          ? { type: "primary" }
                          : {})}
                      >
                        {item.title}
                      </Menu.Item>
                    );
                  })}
                </Menu>
              }
            >
              <Button>{store.currentFilter.title}</Button>
            </Dropdown> */}

            <span className={styles.menuIcon} onClick={markAllRead}>
              <CheckCheck size={16} />
            </span>
            <span className={styles.menuIcon} onClick={handleRefresh}>
              <RefreshCw
                size={16}
                className={`${syncing ? "spinning" : ""}`}
              />
            </span>
          </div>
        </div>
        {syncing && <div className={styles.syncingBar}>同步中</div>}
        <div className={styles.scrollList} ref={listRef}>
          <ArticleList
            ref={articleListRef}
            title={params.name}
            type={type}
            feedUuid={channelUuid}
            feedUrl={feedUrl || ""}
          />
        </div>
      </div>
      <div className={styles.mainView}>
        <div className={`sticky-header ${styles.viewHeader}`}>
          <div />
          <div className={styles.viewMenu}>
            <span
              className={`${styles.menuIcon} ${
                currentIdx <= 0 && styles.menuIconDisabled
              }`}
              onClick={handleViewPrevious}
            >
              <ChevronUpIcon className={"h-4 w-4"} />
            </span>
            <span
              className={`${styles.menuIcon} ${
                currentIdx >= store.articleList.length - 1 &&
                styles.menuIconDisabled
              }`}
              onClick={handleViewNext}
            >
              <ChevronDownIcon className={"h-4 w-4"} />
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <span className={styles.menuIcon}>
                  <PaintBrushIcon className={"h-4 w-4"} />
                </span>
              </PopoverTrigger>
              <PopoverContent className="bg-detail-bg">
                <CustomizeStyle
                  styleConfig={store.userConfig.customize_style}
                />
              </PopoverContent>
            </Popover>
            <span className={styles.menuIcon} onClick={handleViewSourcePage}>
              <GlobeAltIcon className={"h-4 w-4"} />
            </span>
            <a
              className={styles.menuIcon}
              target="_blank"
              rel="noreferrer"
              href={store.article?.link as string}
            >
              <ArrowTopRightOnSquareIcon className={"h-4 w-4"} />
            </a>
            <span className={styles.menuIcon} onClick={handleCopyLink}>
              <LinkIcon className={"h-4 w-4"} />
            </span>
          </div>
        </div>
        <div className={styles.scrollView} ref={viewRef}>
          {/* <CustomizeStyle styleConfig={store.userConfig.customize_style} /> */}
          <ArticleView article={store.article} userConfig={store.userConfig} />
        </div>
      </div>
    </div>
  );
};
