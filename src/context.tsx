import React from "react";
import { Article, Channel } from "./db";

interface PContext {
  channel: Channel | null,
  article: Article | null,
  currentFilter: { id: string, title: string },
  filterList: { id: string, title: string }[]
}

export const StoreContext = React.createContext({
  channel: null,
  article: null,
  filterList: [
    {
      id: "1",
      title: "所有文章"
    },
    {
      id: "2",
      title: "未读文章"
    },
    {
      id: "3",
      title: "已读文章"
    }
  ],
  currentFilter: {
    id: "2",
    title: "未读文章"
  },
} as PContext);
