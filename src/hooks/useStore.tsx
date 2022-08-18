import { useContext } from "react";
import { StoreContext } from "../context";

export const useStore = () => {
  const store = useContext(StoreContext)
  return {
    channel: store.channel,
    article: store.article,
    currentFilter: store.currentFilter,
    filterList: store.filterList,
    setFilter: store.setFilter,
  }
};
