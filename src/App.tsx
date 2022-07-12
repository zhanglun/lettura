import React from "react";
import {
  Outlet
} from 'react-router-dom';
import {ChannelList} from './components/ChannelList';
import styles from './App.module.css';
import "./styles/index.global.css";
import "./App.css";

function App() {
  return (
    <div className={styles.container}>
      <ChannelList/>
      <Outlet />
    </div>
  );
}

export default App;
