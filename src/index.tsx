import React from 'react';
import ReactDOM from 'react-dom';
import { initEvent } from './event/renderer';
import App from './app';

import './view/styles/index.global.css';

ReactDOM.render(<App />, document.getElementById('root'));
initEvent();
