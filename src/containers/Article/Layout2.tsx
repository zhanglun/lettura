import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleList, ArticleListRefType } from "@/components/ArticleList";
import { ArticleView } from "@/components/ArticleView";
import * as dataAgent from "../../helpers/dataAgent";
import { useBearStore } from "@/hooks/useBearStore";
import styles from "./index.module.scss";
import {
  Filter,
  CheckCheck,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Paintbrush,
  Link,
  Ghost, Share, Layout, LayoutGrid, LayoutList, LayoutPanelLeft
} from "lucide-react";
import { busChannel } from "@/helpers/busChannel";
import { Article } from "@/db";
import { CustomizeStyle } from "@/components/SettingPanel/CustomizeStyle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import classNames from "classnames";

import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { Icon } from "@/components/Icon";

import { open } from "@tauri-apps/api/shell";
import { Separator } from "@/components/ui/separator";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const Layout2 = (): JSX.Element => {
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
    userConfig: state.userConfig
  }));

  const { toast } = useToast();
  const [ layoutType, setLayoutType ] = useState(1);

  const query = useQuery();
  const feedUrl = query.get("feedUrl");
  const type = query.get("type");
  const channelUuid = query.get("channelUuid");
  const [ syncing, setSyncing ] = useState(false);
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
  }, [ store.articleList ]);

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
        threshold: 1
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
  }, [ articleListRef.current ]);

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
          const [ num, message ] = res;

          console.log("%c Line:77 🥛 res", "color:#ea7e5c", res);

          if (message) {
            toast({
              title: "Something wrong!",
              description: message,
              action: (
                <ToastAction altText="Goto schedule to undo">Close</ToastAction>
              )
            });
          } else {
            getArticleList();
            busChannel.emit("updateChannelUnreadCount", {
              uuid: channelUuid as string,
              action: "increase",
              count: num || 0
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
      function() {
        toast({
          description: "Copied"
        });
      },
      function(err) {
        console.error("Async: Could not copy text: ", err);
      }
    );
  };

  const handleRefresh = () => {
    syncArticles();
  };

  const handleSetLayout = (type: number) => {
    setLayoutType(type);
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
    if (store.filterList.some((_) => _.id === parseInt(id, 10))) {
      store.setFilter({
        ...store.filterList.filter((_) => _.id === parseInt(id, 10))[0]
      });
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
  }, [ store.articleList ]);

  useEffect(() => {
    resetScrollTop();
  }, [ store.article ]);

  useEffect(() => {
    resetScrollTop();
  }, []);

  useEffect(() => {
    if (listRef.current !== null) {
      listRef.current.scroll(0, 0);
    }

    setCurrentIdx(-1);
  }, [ channelUuid ]);

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
    <>
      TODO Layout2
    </>
  );
};
