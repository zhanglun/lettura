import React from "react";
import {
  Outlet
} from "react-router-dom";
import { StoreContext } from "./context";
import { ChannelList } from "./components/ChannelList";
import styles from "./App.module.css";
import "./styles/index.global.css";
import "./App.css";

function App() {
  return (
    <StoreContext.Provider value={{
      channel: null,
      article: null
    }}>
      <div className={styles.container}>
        <ChannelList />
        <Outlet />
      </div>
    </StoreContext.Provider>
  );
}

export default App;
