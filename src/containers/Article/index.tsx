import React, { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { ArticleListRefType } from "@/components/ArticleList";
import * as dataAgent from "../../helpers/dataAgent";
import { useBearStore } from "@/stores";
import styles from "./index.module.scss";
import {
  Filter,
  CheckCheck,
  RefreshCw,
  Layout,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import { busChannel } from "@/helpers/busChannel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { Icon } from "@/components/Icon";
import { Separator } from "@/components/ui/separator";
import { Layout1 } from "@/containers/Article/Layout1";
import { Layout2 } from "@/containers/Article/Layout2";
import { Layout3 } from "@/containers/Article/Layout3";
import { ArticleDialogView } from "@/components/ArticleView/DialogView";
import { ToolbarItemNavigator } from "@/containers/Article/ToolBar";
import { ReadingOptions } from "@/containers/Article/ReadingOptions";
import { useQuery } from "@/helpers/parseXML";
import { useShortcut } from "@/hooks/useShortcut";
import { open } from "@tauri-apps/api/shell";
import { TooltipBox } from "@/components/TooltipBox";
import { useMatch } from "react-router-dom";
import { RouteConfig } from "@/config";

export const ArticleContainer = (): JSX.Element => {
  const store = useBearStore((state) => ({
    viewMeta: state.viewMeta,
    article: state.article,
    articleList: state.articleList,
    setArticle: state.setArticle,
    updateArticleAndIdx: state.updateArticleAndIdx,
    feed: state.feed,

    articleDialogViewStatus: state.articleDialogViewStatus,
    setArticleDialogViewStatus: state.setArticleDialogViewStatus,
    markArticleListAsRead: state.markArticleListAsRead,

    filterList: state.filterList,
    currentFilter: state.currentFilter,
    setFilter: state.setFilter,

    currentIdx: state.currentIdx,
    setCurrentIdx: state.setCurrentIdx,
    userConfig: state.userConfig,
  }));

  const isToday = useMatch(RouteConfig.TODAY);
  const isAll = useMatch(RouteConfig.ALL);
  const { toast } = useToast();
  const [layoutType, setLayoutType] = useState(1);
  const [feedUrl] = useQuery();
  const [syncing, setSyncing] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const articleListRef = useRef<ArticleListRefType>(null);
  const { currentIdx, setCurrentIdx } = store;
  const { registerShortcut, unregisterShortcut } = useShortcut();

  const handleViewScroll = () => {
    if (viewRef.current) {
      const scrollTop = viewRef.current.scrollTop;

      if (scrollTop > 0) {
        viewRef.current?.parentElement?.classList.add("is-scroll");
      } else {
        viewRef.current?.parentElement?.classList.remove("is-scroll");
      }
    }
  };

  const openInBrowser = () => {
    store.article && open(store.article.link);
  };

  useEffect(() => {
    registerShortcut("o", () => openInBrowser());

    return () => {
      unregisterShortcut("o");
    };
  }, [store.article]);

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
    if (store.feed?.uuid) {
      setSyncing(true);

      dataAgent
        .syncArticlesWithChannelUuid(
          store.feed?.item_type as string,
          store.feed?.uuid as string
        )
        .then((res) => {
          const [num, uuid, message] = res[0];

          console.log("%c Line:77 🥛 res", "color:#ea7e5c", res);

          if (message) {
            toast({
              title: "Something wrong!",
              variant: "destructive",
              description: message,
              action: (
                <ToastAction altText="Goto schedule to undo">Close</ToastAction>
              ),
            });
          } else {
            getArticleList();
            busChannel.emit("updateChannelUnreadCount", {
              uuid: store.feed?.uuid as string,
              isToday: true,
              action: "increase",
              count: num || 0,
            });
            toast({
              title: "Success",
              description: message,
              action: (
                <ToastAction altText="Goto schedule to undo">Close</ToastAction>
              ),
            });
          }
        })
        .finally(() => {
          setSyncing(false);
        });
    }
  };

  const handleRefresh = () => {
    syncArticles();
  };

  const handleSetLayout = (type: number) => {
    setLayoutType(type);
  };

  const markAllRead = () => {
    return store.markArticleListAsRead(!!isToday, !!isAll);
  };

  const changeFilter = (id: any) => {
    if (store.filterList.some((_) => _.id === parseInt(id, 10))) {
      store.setFilter({
        ...store.filterList.filter((_) => _.id === parseInt(id, 10))[0],
      });
    }
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
    console.log(
      "%c Line:211 🥤 store.feed?.uuid",
      "color:#fca650",
      store.feed?.uuid
    );

    if (listRef.current !== null) {
      listRef.current.scroll(0, 0);
    }

    setCurrentIdx(-1);
  }, [store.feed?.uuid]);

  return (
    <div className={classNames(styles.article)}>
      <div className={`${styles.header}`}>
        <div
          className="
            flex
            items-center
            px-3
            text-lg
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
              <RefreshCw size={16} className={`${syncing ? "spinning" : ""}`} />
            </Icon>
          </TooltipBox>
          <span>
            <Separator orientation="vertical" className="h-4 mx-2" />
          </span>
          <Icon onClick={() => handleSetLayout(1)} active={layoutType === 1}>
            <Layout size={16} />
          </Icon>
          <Icon onClick={() => handleSetLayout(2)} active={layoutType === 2}>
            <LayoutGrid size={16} />
          </Icon>
          <Icon onClick={() => handleSetLayout(3)} active={layoutType === 3}>
            <LayoutList size={16} />
          </Icon>
          <span>
            <Separator orientation="vertical" className="h-4 mx-2" />
          </span>
          <ToolbarItemNavigator listRef={listRef} />
          <span>
            <Separator orientation="vertical" className="h-4 mx-2" />
          </span>
          <ReadingOptions />
        </div>
      </div>
      <div className="h-[100vh_-_var(--app-toolbar-height)]">
        {layoutType === 1 && <Layout1 />}
        {layoutType === 2 && <Layout2 />}
        {layoutType === 3 && <Layout3 />}
      </div>
      <ArticleDialogView
        article={store.article}
        userConfig={store.userConfig}
        dialogStatus={store.articleDialogViewStatus}
        setDialogStatus={store.setArticleDialogViewStatus}
        afterConfirm={() => {}}
        afterCancel={() => {
          store.setArticle(null);
          console.log("store.article", store.article);
        }}
      />
    </div>
  );
};
