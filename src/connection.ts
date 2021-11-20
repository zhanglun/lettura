import { Connection, createConnection } from 'typeorm';
import log from 'electron-log';
import { ChannelEntity } from './entity/channel';
import { ArticleEntity } from './entity/article';
import { FolderEntity } from './entity/folder';

let connect: Connection;

export const connection = () => {
  if (connect) {
    return Promise.resolve(connect);
  }

  return createConnection({
    type: 'better-sqlite3',
    database: './public/salix.sqlite',
    entities: [ChannelEntity, ArticleEntity, FolderEntity],
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
      connect = c;

      return c;
    })
    .catch((err) => {
      log.error('err', err);
    });
};
