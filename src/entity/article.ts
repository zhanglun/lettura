import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
// eslint-disable-next-line import/no-cycle
import { ChannelEntity } from './channel';

@Entity('article')
export class ArticleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: '' })
  title: string;

  @Column({ type: 'varchar', unique: true, default: '' })
  link: string;

  @Column({ type: 'varchar', default: '' })
  description: string;

  @Column({ type: 'varchar', default: '' })
  author: string;

  @Column({ type: 'varchar', default: '' })
  content: string;

  @Column({ type: 'int', default: 1000 })
  category: number;

  @Column({ type: 'varchar', default: '' })
  comments: string;

  @Column({ type: 'datetime', comment: '文章发布时间' })
  pubDate: string;

  @Column({ type: 'datetime', comment: '创建时间' })
  createDate: string;

  @Column({ type: 'datetime', comment: '更新时间' })
  updateDate: string;

  @Column({ type: 'int', default: 0, comment: '已读状态。0：未读 1：已读' })
  hasRead: number;

  @Column({
    type: 'int',
    default: 0,
    comment: '喜欢状态。0：默认 1：标记喜欢',
  })
  isLike: number;

  @ManyToOne(() => ChannelEntity, (channel) => channel.articles)
  channel: ChannelEntity;
}
