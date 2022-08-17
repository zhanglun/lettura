import React from "react";
import {
  Outlet
} from "react-router-dom";
import { StoreContext } from "./context";
import { ChannelList } from "./components/ChannelList";
import styles from "./App.module.css";
import "./styles/index.global.css";
import "./App.css";
import { useStore } from "./hooks/useStore";

function App() {
  const store = useStore();

  return (
    <StoreContext.Provider value={{
      channel: store.channel,
      article: store.article,
      filterList: store.filterList,
      currentFilter: store.currentFilter,
    }}>
      <div className={styles.container}>
        <ChannelList />
        <Outlet />
      </div>
    </StoreContext.Provider>
  );
}

export default App;
