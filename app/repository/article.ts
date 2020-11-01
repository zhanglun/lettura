// import Dayjs from 'dayjs';
// import { dbInstance as db, SalixDatabase } from '../model';
// import { Article, Channel, RSSFeedItem } from '../infra/types';
// import { ArticleReadStatus } from '../infra/constants/status';
//
// class ArticleRepo {
//   private db: SalixDatabase;
//
//   constructor() {
//     this.db = db;
//   }
//
//   async getAll() {
//     const list = await this.db.articles.toArray();
//
//     return list;
//   }
//
//   async getAllInChannel(feedUrl: string): Promise<Article[]> {
//     const query = {
//       feedUrl,
//     };
//
//     const list = await this.db.articles.where(query).toArray();
//
//     return list;
//   }
//
//   async getAllUnread(): Promise<Article[]> {
//     const query = {
//       isRead: ArticleReadStatus.unRead,
//     };
//
//     const list = await this.db.articles.where(query).toArray();
//
//     return list;
//   }
//
//   async getAllUnreadInChannel(feedUrl: string): Promise<Article[]> {
//     const query = {
//       isRead: ArticleReadStatus.unRead,
//       feedUrl,
//     };
//
//     const list = await this.db.articles.where(query).toArray();
//
//     list.forEach((item) => {
//       item.pubDate = Dayjs(item.pubDate).format('YYYY-MM-DD HH:mm');
//       return item;
//     });
//
//     return list;
//   }
//
//   async addOne(feed: Channel): Promise<string> {
//     try {
//       return await this.db.channels.put(feed);
//     } catch (err) {
//       console.log(err);
//       return err.message;
//     }
//   }
//
//   async insertFeedItems(
//     feedUrl: string,
//     channelTitle: string,
//     items: RSSFeedItem[] = []
//   ) {
//     if (!items.length) {
//       return;
//     }
//
//     const values = items.map(
//       (item): Article => {
//         return {
//           feedUrl,
//           channelTitle,
//           ...item,
//           isRead: 0,
//           isLike: 0,
//           createDate: new Date().toString(),
//           updateDate: new Date().toString(),
//         };
//       }
//     );
//
//     await this.db.articles.bulkPut(values);
//   }
// }
//
// export const articleRepo = new ArticleRepo();
