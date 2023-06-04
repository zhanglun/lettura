import { useBearStore } from "@/hooks/useBearStore";
import { useEffect, useRef, useState } from "react";

export const useArticleListHook = (props: { feedUuid: string | null }) => {
  const { feedUuid } = props;
  const [loading, setLoading] = useState(false);
  const store = useBearStore((state) => ({
    currentFilter: state.currentFilter,
    setArticleList: state.setArticleList,
    articleList: state.articleList,
    getArticleList: state.getArticleList,
  }));

  const listRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(1);
  const getList = (feedUuid: string) => {
    const filter: { read_status?: number; cursor: number; limit?: number } = {
      read_status: store.currentFilter.id,
      cursor,
      limit: 12,
    };

    setLoading(true);

    store
      .getArticleList(feedUuid, filter)
      .then((res: any) => {
        console.log("%c Line:66 🍺 list", "color:#e41a6a", res);
      })
      .finally(() => {
        setLoading(false);
      })
      .catch((err: any) => {
        console.log("%c Line:71 🍎 err", "color:#ffdd4d", err);
      });
  };

  const handleListScroll = () => {
    if (listRef.current) {
      const scrollTop = listRef.current.scrollTop;
      console.log("%c Line:42 🎂 scrollTop", "color:#3f7cff", scrollTop);
    }
  };

  useEffect(() => {
    getList(feedUuid || "");
  }, [feedUuid, store.currentFilter]);

  useEffect(() => {
    if (listRef.current) {
      console.log("🚀 ~ file: hooks.tsx:52 ~ useEffect ~ loadRef.current:", loadRef.current)
      const $rootElem = listRef.current as HTMLDivElement;
      const $ul = $rootElem.querySelector("ul") as any;
      let $target = loadRef.current as HTMLDivElement;

      console.log("🚀 ~ file: hooks.tsx:56 ~ useEffect ~ $target:", $target)

      const options = {
        root: $rootElem,
        rootMargin:"0px 0px 50px 0px",
        threshold: 1,
      };

      const callback = (
        entries: IntersectionObserverEntry[],
        observer: IntersectionObserver
      ) => {
        entries.forEach((entry) => {
          console.log(entry);
          if (entry.intersectionRatio > 0.1) {
            getList();
          }
        });
      };

      const observer = new IntersectionObserver(callback, options);

      $target && observer.observe($target);
    }
  }, [listRef.current]);

  return {
    getList,
    loading,
    setLoading,
    listRef,
    loadRef,
  };
};
