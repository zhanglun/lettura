import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', default: '' })
  title: string;

  @Column({ type: 'varchar' })
  link: string;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ type: 'varchar' })
  author: string;

  @Column({ type: 'varchar', default: '' })
  content: string;

  @Column({ type: 'int', default: 1000 })
  category: number;

  @Column({ type: 'varchar' })
  comments: string;

  @Column({ type: 'varchar' })
  pubDate: string;
}
