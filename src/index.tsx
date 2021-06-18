import React from 'react';
import ReactDOM from 'react-dom';
import { ipcRenderer } from 'electron';
import App from './app';

import './view/styles/index.global.css';

ReactDOM.render(<App />, document.getElementById('root'));

// setTimeout(() => {
//   ipcRenderer.send('start');
// }, 2000);

// ipcRenderer.on('start', (_e, stores) => {
//   console.log('stores', stores);

//   ReactDOM.render(<App />, document.getElementById('root'));
// });
