import { createConnection } from 'typeorm';
import log from 'electron-log';
import { ChannelEntity } from './entity/channel';
import { ArticleEntity } from './entity/article';
import { initEvent } from './event/renderer';

async function init() {
  try {
    await createConnection({
      type: 'better-sqlite3',
      database: './public/salix.sqlite',
      entities: [ChannelEntity, ArticleEntity],
      synchronize: true,
      logging: true,
    });

    initEvent();
  } catch (err) {
    log.catchErrors(err);
  }
}

init();
