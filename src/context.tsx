import React from 'react'
import { Article, Channel } from "./db";

interface PContext {
  channel: Channel | null,
  article: Article | null,
}

export const StoreContext = React.createContext({
  channel: null,
  article: null,
} as PContext)
