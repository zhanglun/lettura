import React, { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { ArticleList, ArticleListRefType } from "@/components/ArticleList";
import { ArticleView } from "@/components/ArticleView";
import * as dataAgent from "../../helpers/dataAgent";
import { useBearStore } from "@/hooks/useBearStore";
import styles from "./index.module.scss";
import { busChannel } from "@/helpers/busChannel";
import { Article } from "@/db";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export const Layout1 = (): JSX.Element => {
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

  const resetScrollTop = () => {
    if (viewRef.current !== null) {
      viewRef.current.scroll(0, 0);
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
    <div className="grid grid-cols-[var(--app-article-width)_1fr]">
      <div className="relative h-full border-r border-stone-100">
        { syncing && <div className={ styles.syncingBar }>同步中</div> }
        <div className={ styles.scrollList } ref={ listRef }>
          <ArticleList
            ref={ articleListRef }
            title={ params.name }
            type={ type }
            feedUuid={ channelUuid }
            feedUrl={ feedUrl || "" }
          />
        </div>
      </div>
      <div className={ styles.scrollView } ref={ viewRef }>
        <ArticleView article={ store.article } userConfig={ store.userConfig } />
      </div>
    </div>
  );
};
