import React, {useEffect, useState} from "react";
import {DndProvider} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import {appWindow} from "@tauri-apps/api/window";
import {Outlet} from "react-router-dom";
import {ChannelList} from "./components/ChannelList";
import {useBearStore} from "./hooks/useBearStore";
import * as dataAgent from "./helpers/dataAgent";
import styles from "./App.module.css";
import "./styles/index.global.scss";
import "./App.css";
import {Article} from "./db";
import {busChannel} from "./helpers/busChannel";

function App() {
  const store = useBearStore(state => ({
    goPreviousArticle: state.goPreviousArticle,
    goNextArticle: state.goNextArticle,
  }));

  console.log("%c Line:17 🥓 store", "color:#42b983", store);

  useEffect(() => {
    document
      .getElementById("titlebar-minimize")
      ?.addEventListener("click", () => appWindow.minimize());
    document
      .getElementById("titlebar-maximize")
      ?.addEventListener("click", () => appWindow.toggleMaximize());
    document
      .getElementById("titlebar-close")
      ?.addEventListener("click", () => appWindow.close());
  }, []);

  useEffect(() => {
    dataAgent.getUserConfig().then((res) => {
      console.log("user config", res);
    });
  }, []);

  const goPrev = (elem: HTMLElement, tagName: string) => {
    if (tagName === "a") {
    } else if (tagName === "li") {
      store.goPreviousArticle();
      busChannel.emit("goPreviousArticle");
    }
  };

  const goNext = (elem: HTMLElement, tagName: string) => {
    if (tagName === "a") {
    } else if (tagName === "li") {
      store.goNextArticle();
      busChannel.emit("goNextArticle");
    }
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement;
    const tagName = activeElement.tagName.toLowerCase();

    switch (event.key) {
      case "ArrowDown":
      case "j":
        goNext(activeElement, tagName);
        event.preventDefault();
        break;
      case "ArrowUp":
      case "k":
        goPrev(activeElement, tagName);
        event.preventDefault();
        break;
      default:
        break;
    }

    console.log("event", event);
  };

  useEffect(() => {
    document.addEventListener("keydown", (e) => handleKeyPress(e));
    return () => {
      document.removeEventListener("keydown", (e) => handleKeyPress(e));
    };
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.container}>
        <ChannelList/>
        <Outlet/>
      </div>
    </DndProvider>
  );
}

export default App;
