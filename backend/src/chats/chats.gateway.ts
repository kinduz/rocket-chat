import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { IsUUID } from 'class-validator';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { MessageDTO } from './dto';
import { ChatMember } from './entities';

export class TypingPayload {
  @IsUUID()
  chatId: string;
}

export class JoinChatPayload {
  @IsUUID()
  chatId: string;
}

export type ChatReadEvent = {
  chatId: string;
  userId: string;
  lastReadAt: string;
};

export type ChatDeliveredEvent = {
  chatId: string;
  userId: string;
  lastDeliveredAt: string;
};

export type ChatTypingEvent = {
  chatId: string;
  userId: string;
};

const chatRoom = (chatId: string) => `chat:${chatId}`;
const userRoom = (userId: string) => `user:${userId}`;

@WebSocketGateway({
  cors: { origin: true, credentials: true },
  path: '/ws',
})
@UsePipes(new ValidationPipe({ whitelist: true }))
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatsGateway.name);
  private readonly connectedUsers = new Map<string, number>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(ChatMember)
    private readonly chatMemberRepository: Repository<ChatMember>,
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const token = this.extractToken(socket);
      if (!token) {
        socket.disconnect(true);
        return;
      }
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      socket.data.userId = payload.sub;
      this.connectedUsers.set(
        payload.sub,
        (this.connectedUsers.get(payload.sub) ?? 0) + 1,
      );
      await socket.join(userRoom(payload.sub));
    } catch (err) {
      this.logger.warn(`WS auth failed: ${(err as Error).message}`);
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket): void {
    const userId = socket.data.userId as string | undefined;
    if (userId) {
      const next = (this.connectedUsers.get(userId) ?? 1) - 1;
      if (next > 0) {
        this.connectedUsers.set(userId, next);
      } else {
        this.connectedUsers.delete(userId);
      }
    }
    socket.data.userId = undefined;
  }

  @SubscribeMessage('chat:join')
  async onJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: JoinChatPayload,
  ): Promise<void> {
    if (!socket.data.userId) return;
    await socket.join(chatRoom(body.chatId));
  }

  @SubscribeMessage('chat:leave')
  async onLeave(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: JoinChatPayload,
  ): Promise<void> {
    if (!socket.data.userId) return;
    await socket.leave(chatRoom(body.chatId));
  }

  @SubscribeMessage('chat:typing')
  async onTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: TypingPayload,
  ): Promise<void> {
    const userId = socket.data.userId as string | undefined;
    if (!userId) return;
    const isMember = await this.chatMemberRepository.existsBy({
      chatId: body.chatId,
      userId,
    });
    if (!isMember) return;

    const members = await this.chatMemberRepository.find({
      where: { chatId: body.chatId },
      select: { userId: true },
    });
    const event: ChatTypingEvent = { chatId: body.chatId, userId };
    for (const m of members) {
      if (m.userId === userId) continue;
      this.server.to(userRoom(m.userId)).emit('chat:typing', event);
    }
  }

  emitNewMessageToUser(message: MessageDTO, userId: string): void {
    this.server.to(userRoom(userId)).emit('message:new', {
      chatId: message.chatId,
      message,
    });
  }

  emitMessageUpdatedToUser(message: MessageDTO, userId: string): void {
    this.server.to(userRoom(userId)).emit('message:updated', {
      chatId: message.chatId,
      message,
    });
  }

  emitMessagesDeletedToUser(
    event: {
      chatId: string;
      messageIds: string[];
      unreadDecrement: number;
    },
    userId: string,
  ): void {
    this.server.to(userRoom(userId)).emit('messages:deleted', event);
  }

  emitChatDeletedToUser(event: { chatId: string }, userId: string): void {
    this.server.to(userRoom(userId)).emit('chat:deleted', event);
  }

  emitChatRead(event: ChatReadEvent, recipientUserIds: string[]): void {
    this.server.to(chatRoom(event.chatId)).emit('chat:read', event);
    for (const userId of recipientUserIds) {
      this.server.to(userRoom(userId)).emit('chat:read', event);
    }
  }

  emitChatDelivered(
    event: ChatDeliveredEvent,
    recipientUserIds: string[],
  ): void {
    this.server.to(chatRoom(event.chatId)).emit('chat:delivered', event);
    for (const userId of recipientUserIds) {
      this.server.to(userRoom(userId)).emit('chat:delivered', event);
    }
  }

  getOnlineUserIds(userIds: string[]): string[] {
    return userIds.filter((userId) => this.connectedUsers.has(userId));
  }

  private extractToken(socket: Socket): string | null {
    const auth = socket.handshake.auth?.token as string | undefined;
    if (auth) return auth;
    const header = socket.handshake.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);
    const query = socket.handshake.query?.token;
    if (typeof query === 'string') return query;
    return null;
  }
}
