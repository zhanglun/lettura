import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RouteConfig } from "./config";
import { ArticleContainer } from "./containers/Article";
import { SettingContainer } from "./containers/Setting";

import { General } from './components/SettingPanel/General';
import { Appearance } from './components/SettingPanel/Appearance';
import { Notification } from './components/SettingPanel/Notification';
import { FeedManager } from './components/SettingPanel/FeedManager';
import { ImportAndExport } from './components/SettingPanel/ImportAndExport';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path={"/"} element={<App />}>
          <Route
            path={RouteConfig.CHANNEL}
            element={<ArticleContainer />}
          ></Route>
          <Route
            path={RouteConfig.SETTINGS}
            element={<SettingContainer />}
          >
            <Route path={RouteConfig.SETTINGS_GENERAL} element={<General />}></Route>
            <Route path={RouteConfig.SETTINGS_APPEARANCE} element={<Appearance />}></Route>
            <Route path={RouteConfig.SETTINGS_NOTIFICATION} element={<Notification />}></Route>
            <Route path={RouteConfig.SETTINGS_FEED_MANAGER} element={<FeedManager />}></Route>
            <Route path={RouteConfig.SETTINGS_IMPORT} element={<ImportAndExport />}></Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
