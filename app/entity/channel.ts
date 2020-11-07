import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', default: '' })
  title: string;

  @Column({ type: 'varchar', default: '' })
  description: string;

  @Column({ type: 'varchar' })
  feedUrl: string;

  @Column({ type: 'varchar' })
  link: string;

  @Column({ type: 'int', default: 1000 })
  ttl: number;

  @Column({ type: 'varchar' })
  favicon: string;

  @Column({ type: 'varchar' })
  category: string;

  @Column({ type: 'varchar' })
  tag: string;

  @Column({ type: 'varchar' })
  createDate: string;

  @Column({ type: 'varchar' })
  updateDate: string;
}
