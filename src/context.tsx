import React from "react";
import { Article, Channel } from "./db";

interface PContext {
  channel: Channel | null,
  setChannel: (channel: Channel) => void,
  article: Article | null,
  setArticle: (article: Article) => void,
  updateChannelCount: (article: Article, action: string, count: number) => void,
  currentFilter: { id: string, title: string },
  filterList: { id: string, title: string }[],
  setFilter: any
}

export const StoreContext = React.createContext({
  channel: null,
  article: null,
  filterList: [
    {
      id: "1",
      title: "All"
    },
    {
      id: "2",
      title: "Unread"
    },
    {
      id: "3",
      title: "Read"
    }
  ],
  currentFilter: {
    id: "2",
    title: "Unread"
  },
} as PContext);
