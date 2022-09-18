import { useContext } from "react";
import { StoreContext } from "../context";

export const useStore = () => {
  const store = useContext(StoreContext)
  return {
    // channel: store.channel,
    // article: store.article,
    // setArticle: store.setArticle,
    // currentFilter: store.currentFilter,
    // filterList: store.filterList,
    // setFilter: store.setFilter,
    ...store
  }
};
