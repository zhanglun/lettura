import { useBearStore } from "@/hooks/useBearStore";
import { useEffect, useState } from "react";

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
  const getList = (feedUuid: string) => {
    const filter: { read_status?: number; limit?: number } = {
      read_status: store.currentFilter.id
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

  useEffect(() => {
    getList(feedUuid || "");
  }, [ feedUuid, store.currentFilter ]);

  return {
    getList,
    loading,
    setLoading,
  }
}
