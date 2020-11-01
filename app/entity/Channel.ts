import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column({ type: 'varchar' })
  title: string | undefined;

  @Column({ type: 'varchar' })
  feedUrl: string | undefined;

  @Column({ type: 'varchar' })
  favicon: string | undefined;

  @Column({ type: 'varchar' })
  category: string | undefined;

  @Column({ type: 'varchar' })
  tag: string | undefined;

  @Column({ type: 'varchar' })
  createDate: string | undefined;

  @Column({ type: 'varchar' })
  updateDate: string | undefined;
}
