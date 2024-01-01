import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ArticleList } from "@/components/ArticleList";
import { useBearStore } from "@/stores";

import { Filter, CheckCheck, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Icon } from "@/components/Icon";
import { TooltipBox } from "@/components/TooltipBox";
import { useArticle } from "./useArticle";
import { loadFeed } from "@/hooks/useLoadFeed";
import { ArticleReadStatus } from "@/typing";
import { useHotkeys } from "react-hotkeys-hook";
import { throttle } from "lodash";
import { ArticleResItem } from "@/db";

export const Layout1 = React.memo(
  (props: { feedUuid?: string; type?: string }) => {
    const { feedUuid, type } = props;
    // @ts-ignore
    const params: { name: string } = useParams();
    const [isSyncing, setIsSyncing] = useState(false);
    const [currentUuid, setCurrentUuid] = useState<string>();
    const listRef = useRef<HTMLDivElement>(null);

    const store = useBearStore((state) => ({
      viewMeta: state.viewMeta,
      article: state.article,
      setArticle: state.setArticle,
      updateArticleAndIdx: state.updateArticleAndIdx,
      feed: state.feed,
      syncArticles: state.syncArticles,
      markArticleListAsRead: state.markArticleListAsRead,

      updateArticleStatus: state.updateArticleStatus,

      filterList: state.filterList,
      currentFilter: state.currentFilter,
      setFilter: state.setFilter,

      userConfig: state.userConfig,
    }));

    const {
      articles,
      error,
      isLoading,
      isValidating,
      isLoadingMore,
      size,
      mutate,
      setSize,
      isEmpty,
      isReachingEnd,
      isRefreshing,
      isToday,
      isAll,
    } = useArticle({
      feedUuid,
      type,
    });

    const handleRefresh = () => {
      if (store.feed && store.feed.uuid) {
        setIsSyncing(true);
        loadFeed(
          store.feed,
          store.syncArticles,
          () => {
            mutate();
            setIsSyncing(false);
          },
          () => {
            setIsSyncing(false);
          }
        );
      }
    };

    const markAllRead = () => {
      return store.markArticleListAsRead(isToday, isAll).then(() => {
        mutate();
      });
    };

    const changeFilter = (id: any) => {
      if (store.filterList.some((_) => _.id === parseInt(id, 10))) {
        store.setFilter({
          ...store.filterList.filter((_) => _.id === parseInt(id, 10))[0],
        });
      }
    };

    function calculateItemPosition(
      direction: "up" | "down",
      article: ArticleResItem | null
    ) {
      if (!article?.uuid) {
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

    function goPreviousArticle() {
      let previousItem: ArticleResItem;
      let uuid = store.article?.uuid;

      for (let i = 0; i < articles.length; i++) {
        if (articles[i].uuid === uuid && i !== 0) {
          previousItem = articles[i - 1];
          previousItem.read_status = ArticleReadStatus.READ;

          store.updateArticleStatus(previousItem, ArticleReadStatus.READ);
          setCurrentUuid((_) => previousItem.uuid);
          store.setArticle(previousItem);
          calculateItemPosition("up", previousItem);

          break;
        }
      }
    }

    const goNextArticle = () => {
      let nextItem: ArticleResItem = {} as ArticleResItem;
      let uuid = store.article?.uuid;

      for (let i = 0; i < articles.length; i++) {
        if (articles[i].uuid === uuid && i === articles.length) {
          return [true];
        }

        if (articles[i].uuid === uuid && i < articles.length - 1) {
          nextItem = articles[i + 1];
          break;
        }
      }

      if (!uuid && articles.length > 0) {
        nextItem = articles[0];
      }

      nextItem.read_status = ArticleReadStatus.READ;
      store.updateArticleStatus(nextItem, ArticleReadStatus.READ);
      store.setArticle(nextItem);
      calculateItemPosition("down", nextItem);

      return [false];
    };

    const goPrev = useCallback(
      throttle(() => {
        console.warn("goPrev");
        goPreviousArticle();
      }, 300),
      [currentUuid, articles]
    );

    const goNext = useCallback(
      throttle(() => {
        console.warn("goNext");
        const [shouldLoad] = goNextArticle();
        console.log("%c Line:111 🍏 shouldLoad", "color:#42b983", shouldLoad);

        if (shouldLoad) {
          // getList({ cursor: store.cursor + 1 });
        }
      }, 300),
      [currentUuid, articles]
    );

    useHotkeys("n", goNext);
    useHotkeys("Shift+n", goPrev);

    return (
      <div className="shrink-0 basis-[var(--app-article-width)] border-r">
        <div className="h-[var(--app-toolbar-height)] grid grid-cols-[auto_1fr] items-center justify-between border-b">
          <div
            className="
            flex
            items-center
            px-3
            text-base
            font-bold
            w-full
            text-ellipsis
            overflow-hidden
            whitespace-nowrap
            text-article-headline
          "
          >
            {store.viewMeta ? store.viewMeta.title : ""}
          </div>
          <div className={"flex items-center justify-end px-2 space-x-0.5"}>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <TooltipBox content="Filter">
                  <Icon>
                    <Filter size={16} />
                  </Icon>
                </TooltipBox>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuRadioGroup
                  value={`${store.currentFilter.id}`}
                  onValueChange={changeFilter}
                >
                  {store.filterList.map((item) => {
                    return (
                      <DropdownMenuRadioItem
                        key={`${item.id}`}
                        value={`${item.id}`}
                      >
                        {item.title}
                      </DropdownMenuRadioItem>
                    );
                  })}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipBox content="Mark all as read">
              <Icon onClick={markAllRead}>
                <CheckCheck size={16} />
              </Icon>
            </TooltipBox>
            <TooltipBox content="Reload feed">
              <Icon onClick={handleRefresh}>
                <RefreshCw
                  size={16}
                  className={`${isSyncing ? "spinning" : "333"}`}
                />
              </Icon>
            </TooltipBox>
          </div>
        </div>
        <div className="relative h-full">
          <ArticleList
            ref={listRef}
            articles={articles}
            title={params.name}
            type={type}
            feedUuid={feedUuid}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            isEmpty={isEmpty}
            isReachingEnd={isReachingEnd}
            size={size}
            setSize={setSize}
          />
        </div>
      </div>
    );
  }
);
