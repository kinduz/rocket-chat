import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
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
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { MessageDTO } from './dto';

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

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const token = this.extractToken(socket);
      if (!token) {
        socket.disconnect(true);
        return;
      }
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      socket.data.userId = payload.sub;
      await socket.join(userRoom(payload.sub));
    } catch (err) {
      this.logger.warn(`WS auth failed: ${(err as Error).message}`);
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket): void {
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
  onTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: TypingPayload,
  ): void {
    const userId = socket.data.userId as string | undefined;
    if (!userId) return;
    const event: ChatTypingEvent = { chatId: body.chatId, userId };
    socket.to(chatRoom(body.chatId)).emit('chat:typing', event);
  }

  emitNewMessage(message: MessageDTO, recipientUserIds: string[]): void {
    const event = { chatId: message.chatId, message };
    this.server.to(chatRoom(message.chatId)).emit('message:new', event);
    for (const userId of recipientUserIds) {
      this.server.to(userRoom(userId)).emit('message:new', event);
    }
  }

  emitChatRead(event: ChatReadEvent, recipientUserIds: string[]): void {
    this.server.to(chatRoom(event.chatId)).emit('chat:read', event);
    for (const userId of recipientUserIds) {
      this.server.to(userRoom(userId)).emit('chat:read', event);
    }
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
