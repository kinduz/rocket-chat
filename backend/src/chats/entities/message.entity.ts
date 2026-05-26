import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('messages')
@Index(['chatId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  chatId: string;

  @Column({ type: 'uuid' })
  senderId: string;

  @Column({ type: 'text' })
  text: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
