import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ChatType = 'direct' | 'group';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['direct', 'group'] })
  type: ChatType;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'uuid', nullable: true })
  lastMessageId: string | null;

  @Column({ type: 'text', nullable: true })
  lastMessageText: string | null;

  @Column({ type: 'uuid', nullable: true })
  lastMessageSenderId: string | null;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
