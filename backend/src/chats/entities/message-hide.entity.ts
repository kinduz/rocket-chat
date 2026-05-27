import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('message_hides')
@Index(['userId', 'messageId'], { unique: true })
@Index(['userId', 'chatId'])
export class MessageHide {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  messageId: string;

  @Column({ type: 'uuid' })
  chatId: string;

  @CreateDateColumn()
  createdAt: Date;
}
