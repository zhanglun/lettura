import React from "react";
import { createRoot } from 'react-dom/client';
import reportWebVitals from "./reportWebVitals";
import { Toaster } from "./components/ui/Toaster";
import App from "./App";
import "./index.css";

const domNode = document.getElementById('root') as HTMLElement;
const root = createRoot(domNode);

root.render(
  <>
    <Toaster />
    <App />
  </>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
