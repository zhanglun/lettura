import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from 'react-dnd-html5-backend'
import { appWindow } from '@tauri-apps/api/window'
import { Outlet } from "react-router-dom";
import { StoreContext } from "./context";
import { ChannelList } from "./components/ChannelList";
import { useStore } from "./hooks/useStore";
import * as dataAgent from "./helpers/dataAgent";
import styles from "./App.module.css";
import "./styles/index.global.scss";
import "./App.css";
import { Article } from "./db";

function App() {
  const store = useStore();

  const [filter, setFilter] = useState({ ...store.currentFilter });
  const [article, setArticle] = useState(store.article);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [channel, setChannel] = useState(store.channel);
  const [articleList, setArticleList] = useState(store.articleList);

  const updateArticleAndIdx = (article: Article, idx?: number) => {
    if (idx === undefined || idx <= 0) {
      idx = articleList.findIndex((item) => item.uuid === article.uuid);
    }

    setCurrentIdx(idx);
    setArticle(article);
  }

  useEffect(() => {
    document
      .getElementById('titlebar-minimize')
      ?.addEventListener('click', () => appWindow.minimize())
    document
      .getElementById('titlebar-maximize')
      ?.addEventListener('click', () => appWindow.toggleMaximize())
    document
      .getElementById('titlebar-close')
      ?.addEventListener('click', () => appWindow.close())
  }, []);

  useEffect(() => {
    dataAgent.getUserConfig().then((res) => {
      console.log('user config', res)
    })
  }, [])

  return (
    <StoreContext.Provider value={{
      channel: channel,
      setChannel,
      article: article,
      updateArticleAndIdx,
      articleList: articleList,
      setArticleList,
      setArticle,
      currentIdx,
      setCurrentIdx,
      filterList: store.filterList,
      currentFilter: filter,
      setFilter,
    }}>
      <DndProvider backend={HTML5Backend}>
      <div className={styles.container}>
        <ChannelList/>
        <Outlet/>
      </div>
      </DndProvider>
    </StoreContext.Provider>
  );
}

export default App;
