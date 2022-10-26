import React, { useEffect, useState } from "react";
import { appWindow } from '@tauri-apps/api/window'
import { Outlet } from "react-router-dom";
import { StoreContext } from "./context";
import { ChannelList } from "./components/ChannelList";
import { useStore } from "./hooks/useStore";
import * as dataAgent from "./helpers/dataAgent";
import styles from "./App.module.css";
import "./styles/index.global.scss";
import "./App.css";

function App() {
  const store = useStore();
  const [filter, setFilter] = useState({ ...store.currentFilter });
  const [article, setArticle] = useState(store.article);
  const [channel, setChannel] = useState(store.channel);

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
      setArticle,
      filterList: store.filterList,
      currentFilter: filter,
      setFilter,
    }}>
      <div className={styles.container}>
        <ChannelList/>
        <Outlet/>
      </div>
    </StoreContext.Provider>
  );
}

export default App;
