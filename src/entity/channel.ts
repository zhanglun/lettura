import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinTable,
  OneToMany,
  ManyToMany,
} from 'typeorm';
// eslint-disable-next-line import/no-cycle
import { ArticleEntity } from './article';
// eslint-disable-next-line import/no-cycle
import { FolderEntity } from './folder';

@Entity('channel')
export class ChannelEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: '', comment: '频道标题' })
  title: string;

  @Column({ type: 'varchar', default: '', comment: '描述' })
  description: string;

  @Column({ type: 'varchar', unique: true, comment: '订阅地址' })
  feedUrl: string;

  @Column({ type: 'varchar', comment: '站点链接' })
  link: string;

  @Column({ type: 'int', default: 1000, comment: '刷新时间间隔' })
  ttl: number;

  @Column({ type: 'varchar', comment: '站点icon' })
  favicon: string;

  @Column({ type: 'varchar', comment: '分类' })
  category: string;

  @Column({ type: 'varchar', comment: '标签' })
  tag: string;

  @Column({ type: 'datetime', comment: '添加时间' })
  createDate: string;

  @Column({ type: 'datetime', comment: '更新时间' })
  updateDate: string;

  @Column({ type: 'datetime', default: '', comment: '最后一次同步时间' })
  lastSyncDate: string;

  @OneToMany(() => ArticleEntity, (article) => article.channel)
  articles: ArticleEntity;

  @ManyToMany(() => FolderEntity)
  @JoinTable()
  folders: FolderEntity[];
}
