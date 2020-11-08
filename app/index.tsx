import { Connection, createConnection } from 'typeorm';
import React from 'react';
import ReactDOM from 'react-dom';
import log from 'electron-log';
import App from './app';
import { ChannelEntity } from './entity/channel';
import { ArticleEntity } from './entity/article';
import * as serviceWorker from './serviceWorker';
import './view/styles/index.global.css';
import { StoreContext, ChannelStore, ArticleStore } from './view/stores';

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

createConnection({
  type: 'better-sqlite3',
  database: './public/salix.sqlite',
  entities: [ChannelEntity, ArticleEntity],
  // entities: ['./entity/*.ts'],
  // database: `${__dirname}/public/salix.sqlite`,
  // 没搞明白为什么这里不能使用绝对路径，应该和webpack有关系
  // 在 typeORM的源码中找到了自动加的逻辑
  // https://github.com/typeorm/typeorm/blob/3c3ec34f26e7df72e5f5cfcc25791fae55f8c960/src/util/DirectoryExportedClassesLoader.ts#L40:20
  // https://github.com/typeorm/typeorm/blob/3c3ec34f26e7df72e5f5cfcc25791fae55f8c960/src/platform/PlatformTools.ts#L131
  // entities: [`${__dirname}/entity/*.ts`],
  synchronize: true,
  logging: true,
})
  .then((c: Connection) => {
    const stores = {
      channelStore: new ChannelStore(),
      articleStore: new ArticleStore(),
    };

    ReactDOM.render(
      <StoreContext.Provider value={stores}>
        <App />
      </StoreContext.Provider>,
      document.getElementById('root')
    );

    return c;
  })
  .catch((err) => {
    log.error('err', err);
  });
