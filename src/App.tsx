import React, { useEffect, useState } from "react";
import { appWindow } from '@tauri-apps/api/window'
import { Outlet } from "react-router-dom";
import { StoreContext } from "./context";
import { ChannelList } from "./components/ChannelList";
import { useStore } from "./hooks/useStore";
import styles from "./App.module.css";
import "./styles/index.global.scss";
import "./App.css";

function App() {
  const store = useStore();
  const [filter, setFilter] = useState({...store.currentFilter});

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
  })
  return (
    <StoreContext.Provider value={{
      channel: store.channel,
      article: store.article,
      filterList: store.filterList,
      currentFilter: filter,
      setFilter,
    }}>
      <div className={styles.container}>
        <ChannelList />
        <Outlet />
      </div>
    </StoreContext.Provider>
  );
}

export default App;
