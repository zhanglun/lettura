import { useBearStore } from "@/hooks/useBearStore";
import { useEffect, useRef, useState } from "react";

export const useArticleListHook = (props: {
  feedUuid: string | null
}) => {
  const { feedUuid } = props;
  const [ loading, setLoading ] = useState(false);
  const store = useBearStore(state => ({
    currentFilter: state.currentFilter,
    setArticleList: state.setArticleList,
    articleList: state.articleList,
    getArticleList: state.getArticleList
  }));

  const listRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(1);
  const getList = (feedUuid: string) => {
    const filter: { read_status?: number; cursor: number, limit?: number } = {
      read_status: store.currentFilter.id,
      cursor,
      limit: 12
    };

    setLoading(true);

    store.getArticleList(feedUuid, filter)
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
  }

  useEffect(() => {
    getList(feedUuid || "");
  }, [ feedUuid, store.currentFilter ]);

  useEffect(() => {
    if (listRef.current) {
      const $list = listRef.current as HTMLDivElement;
      $list.addEventListener("scroll", handleListScroll);
    }
  }, []);

  return {
    getList,
    loading,
    setLoading,
    listRef,
  }
}
