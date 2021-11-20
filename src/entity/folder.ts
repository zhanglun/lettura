import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
// eslint-disable-next-line import/no-cycle
import { ChannelEntity } from './channel';

@Entity('folder')
export class FolderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: '' })
  name: string;

  @ManyToMany(() => ChannelEntity)
  @JoinTable()
  channels: ChannelEntity;
}
