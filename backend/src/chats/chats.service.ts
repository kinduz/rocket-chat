import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiErrorCode, ApiException } from 'src/shared';
import { In, LessThan, Repository } from 'typeorm';
import { S3Service } from '../shared/s3';
import { User } from '../user/entities/user.entity';
import { ChatsGateway } from './chats.gateway';
import { MessageDTO, SearchItemDTO } from './dto';
import { Chat, ChatMember, Message } from './entities';

type ChatRow = {
  c_id: string;
  c_type: 'direct' | 'group';
  c_name: string | null;
  c_lastMessageText: string | null;
  c_lastMessageAt: Date | null;
  c_lastMessageSenderId: string | null;
  c_unreadCount: string | number | null;
  u_username: string | null;
  u_firstName: string | null;
  u_lastName: string | null;
  u_avatarKey: string | null;
};

type UserRow = {
  u_id: string;
  u_username: string | null;
  u_email: string | null;
  u_phone: string | null;
  u_firstName: string | null;
  u_lastName: string | null;
  u_avatarKey: string | null;
};

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(ChatMember)
    private readonly chatMemberRepository: Repository<ChatMember>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly s3: S3Service,
    private readonly gateway: ChatsGateway,
  ) {}

  private async ensureMembership(
    userId: string,
    chatId: string,
  ): Promise<void> {
    const exists = await this.chatMemberRepository.existsBy({
      chatId,
      userId,
    });
    if (!exists) {
      const chatExists = await this.chatRepository.existsBy({ id: chatId });
      throw new ApiException(
        chatExists ? ApiErrorCode.FORBIDDEN : ApiErrorCode.CHAT_NOT_FOUND,
      );
    }
  }

  async listMessages(
    userId: string,
    chatId: string,
    opts?: { before?: string; limit?: number },
  ): Promise<MessageDTO[]> {
    await this.ensureMembership(userId, chatId);

    const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
    const where: Record<string, unknown> = { chatId };
    if (opts?.before) {
      where.createdAt = LessThan(new Date(opts.before));
    }

    const [rows, otherLastReadAt] = await Promise.all([
      this.messageRepository.find({
        where,
        order: { createdAt: 'DESC' },
        take: limit,
      }),
      this.getOtherLastReadAt(userId, chatId),
    ]);

    return rows
      .reverse()
      .map((m) => this.toMessageDTO(m, userId, otherLastReadAt));
  }

  async markRead(
    userId: string,
    chatId: string,
    messageId: string,
  ): Promise<{ chatId: string; lastReadAt: string }> {
    await this.ensureMembership(userId, chatId);

    const message = await this.messageRepository.findOne({
      where: { id: messageId, chatId },
    });
    if (!message) {
      throw new ApiException(ApiErrorCode.BAD_REQUEST, {
        message: 'Message does not belong to this chat',
      });
    }

    const member = await this.chatMemberRepository.findOne({
      where: { chatId, userId },
    });
    if (!member) {
      throw new ApiException(ApiErrorCode.FORBIDDEN);
    }

    const next = message.createdAt;
    if (!member.lastReadAt || member.lastReadAt < next) {
      member.lastReadAt = next;
      await this.chatMemberRepository.save(member);

      const recipients = await this.getOtherMemberIds(chatId, userId);
      this.gateway.emitChatRead(
        {
          chatId,
          userId,
          lastReadAt: next.toISOString(),
        },
        recipients,
      );
    }

    return { chatId, lastReadAt: (member.lastReadAt ?? next).toISOString() };
  }

  private async getOtherLastReadAt(
    viewerId: string,
    chatId: string,
  ): Promise<Date | null> {
    const others = await this.chatMemberRepository.find({
      where: { chatId },
    });
    let latest: Date | null = null;
    for (const m of others) {
      if (m.userId === viewerId) continue;
      if (m.lastReadAt && (!latest || m.lastReadAt > latest)) {
        latest = m.lastReadAt;
      }
    }
    return latest;
  }

  private async getOtherMemberIds(
    chatId: string,
    excludeUserId: string,
  ): Promise<string[]> {
    const rows = await this.chatMemberRepository.find({
      where: { chatId },
      select: { userId: true },
    });
    return rows.map((r) => r.userId).filter((id) => id !== excludeUserId);
  }

  async sendMessage(
    userId: string,
    chatId: string,
    text: string,
  ): Promise<MessageDTO> {
    await this.ensureMembership(userId, chatId);
    return this.insertMessage(userId, chatId, text);
  }

  async sendDirectMessage(
    userId: string,
    otherUserId: string,
    text: string,
  ): Promise<{ chatId: string; message: MessageDTO }> {
    if (userId === otherUserId) {
      throw new ApiException(ApiErrorCode.BAD_REQUEST);
    }

    const otherExists = await this.chatRepository.manager
      .createQueryBuilder(User, 'u')
      .where('u.id = :id', { id: otherUserId })
      .getExists();
    if (!otherExists) {
      throw new ApiException(ApiErrorCode.USER_NOT_FOUND);
    }

    let chatId = await this.findDirectChat(userId, otherUserId);
    if (!chatId) {
      chatId = await this.createDirectChat(userId, otherUserId);
    }

    const message = await this.insertMessage(userId, chatId, text);
    return { chatId, message };
  }

  private async insertMessage(
    senderId: string,
    chatId: string,
    rawText: string,
  ): Promise<MessageDTO> {
    const text = rawText.trim();
    const now = new Date();

    const saved = await this.messageRepository.save(
      this.messageRepository.create({ chatId, senderId, text }),
    );

    await this.chatRepository.update(chatId, {
      lastMessageId: saved.id,
      lastMessageText: text,
      lastMessageSenderId: senderId,
      lastMessageAt: now,
    });

    const dto = this.toMessageDTO(saved, senderId, null);
    const recipients = await this.getOtherMemberIds(chatId, senderId);
    this.gateway.emitNewMessage(dto, recipients);
    return dto;
  }

  private toMessageDTO(
    message: Message,
    viewerId: string,
    otherLastReadAt: Date | null,
  ): MessageDTO {
    const fromMe = message.senderId === viewerId;
    const read =
      fromMe && !!otherLastReadAt && otherLastReadAt >= message.createdAt;
    return {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
      fromMe,
      read,
    };
  }

  async findDirectChat(
    userAId: string,
    userBId: string,
  ): Promise<string | null> {
    const row = await this.chatRepository
      .createQueryBuilder('c')
      .innerJoin('chat_members', 'a', 'a.chat_id = c.id AND a.user_id = :a', {
        a: userAId,
      })
      .innerJoin('chat_members', 'b', 'b.chat_id = c.id AND b.user_id = :b', {
        b: userBId,
      })
      .where("c.type = 'direct'")
      .select('c.id', 'id')
      .getRawOne<{ id: string }>();

    return row?.id ?? null;
  }

  async createDirectChat(
    userAId: string,
    userBId: string,
    opts?: { firstMessage?: { text: string; senderId: string } },
  ): Promise<string> {
    const firstMessage = opts?.firstMessage;

    const chat = await this.chatRepository.save(
      this.chatRepository.create({
        type: 'direct',
        name: null,
      }),
    );
    await this.chatMemberRepository.save([
      this.chatMemberRepository.create({ chatId: chat.id, userId: userAId }),
      this.chatMemberRepository.create({ chatId: chat.id, userId: userBId }),
    ]);

    if (firstMessage) {
      await this.insertMessage(
        firstMessage.senderId,
        chat.id,
        firstMessage.text,
      );
    }

    return chat.id;
  }

  async deleteUserChats(userId: string): Promise<void> {
    const rows = await this.chatMemberRepository.find({
      where: { userId },
      select: { chatId: true },
    });
    const chatIds = rows.map((r) => r.chatId);
    if (chatIds.length === 0) return;

    await this.chatMemberRepository.delete({ chatId: In(chatIds) });
    await this.chatRepository.delete({ id: In(chatIds) });
  }

  async getChats(userId: string, q?: string): Promise<SearchItemDTO[]> {
    const query = q?.trim();
    const like = query
      ? `%${query.replace(/[\\%_]/g, (m) => `\\${m}`)}%`
      : null;

    const chatQB = this.chatRepository
      .createQueryBuilder('c')
      .innerJoin(
        'chat_members',
        'me',
        'me.chat_id = c.id AND me.user_id = :userId',
        { userId },
      )
      .leftJoin(
        'chat_members',
        'other',
        "other.chat_id = c.id AND c.type = 'direct' AND other.user_id != :userId",
        { userId },
      )
      .leftJoin(User, 'u', 'u.id = other.user_id')
      .select([
        'c.id AS c_id',
        'c.type AS c_type',
        'c.name AS c_name',
        'c.last_message_text AS "c_lastMessageText"',
        'c.last_message_at AS "c_lastMessageAt"',
        'c.last_message_sender_id AS "c_lastMessageSenderId"',
        `(
          SELECT COUNT(*)::int FROM messages m
          WHERE m.chat_id = c.id
            AND m.sender_id != :userId
            AND m.created_at > COALESCE(me.last_read_at, 'epoch'::timestamptz)
        ) AS "c_unreadCount"`,
        'u.username AS u_username',
        'u.first_name AS "u_firstName"',
        'u.last_name AS "u_lastName"',
        'u.avatar_key AS "u_avatarKey"',
      ])
      .orderBy('c.last_message_at', 'DESC', 'NULLS LAST')
      .limit(50);

    if (like) {
      chatQB.where(
        `(c.type = 'direct' AND (
            u.username ILIKE :like OR
            u.email ILIKE :like OR
            u.first_name ILIKE :like OR
            u.last_name ILIKE :like
          ))
         OR (c.type = 'group' AND c.name ILIKE :like)`,
        { like },
      );
    }

    const chatRows = await chatQB.getRawMany<ChatRow>();
    const items: SearchItemDTO[] = await Promise.all(
      chatRows.map((r) => this.chatToItem(r, userId)),
    );

    if (!like) return items;

    const userRows = await this.chatRepository.manager
      .createQueryBuilder(User, 'u')
      .where('u.id != :userId', { userId })
      .andWhere(
        '(u.username ILIKE :like OR u.email ILIKE :like OR u.first_name ILIKE :like OR u.last_name ILIKE :like)',
        { like },
      )
      .andWhere(
        `u.id NOT IN (
          SELECT other.user_id
          FROM chat_members me
          JOIN chats c ON c.id = me.chat_id AND c.type = 'direct'
          JOIN chat_members other ON other.chat_id = c.id AND other.user_id != :userId
          WHERE me.user_id = :userId
        )`,
        { userId },
      )
      .select([
        'u.id AS u_id',
        'u.username AS u_username',
        'u.email AS u_email',
        'u.phone AS u_phone',
        'u.first_name AS "u_firstName"',
        'u.last_name AS "u_lastName"',
        'u.avatar_key AS "u_avatarKey"',
      ])
      .orderBy('u.username', 'ASC')
      .limit(20)
      .getRawMany<UserRow>();

    items.push(...(await Promise.all(userRows.map((r) => this.userToItem(r)))));
    return items;
  }

  private async chatToItem(
    row: ChatRow,
    userId: string,
  ): Promise<SearchItemDTO> {
    const isDirect = row.c_type === 'direct';
    return {
      kind: 'chat',
      id: row.c_id,
      name: (isDirect ? row.u_username : row.c_name) ?? '',
      firstName: isDirect ? (row.u_firstName ?? null) : null,
      lastName: isDirect ? (row.u_lastName ?? null) : null,
      avatarUrl:
        isDirect && row.u_avatarKey
          ? await this.s3.getPresignedDownloadUrl(row.u_avatarKey)
          : null,
      phone: null,
      unreadCount: Number(row.c_unreadCount ?? 0),
      lastMessage: row.c_lastMessageText
        ? {
            text: row.c_lastMessageText,
            at: (row.c_lastMessageAt ?? new Date()).toISOString(),
            fromMe: row.c_lastMessageSenderId === userId,
          }
        : null,
    };
  }

  private async userToItem(row: UserRow): Promise<SearchItemDTO> {
    return {
      kind: 'user',
      id: row.u_id,
      name: row.u_username ?? row.u_email ?? '',
      firstName: row.u_firstName ?? null,
      lastName: row.u_lastName ?? null,
      avatarUrl: row.u_avatarKey
        ? await this.s3.getPresignedDownloadUrl(row.u_avatarKey)
        : null,
      phone: row.u_phone,
      unreadCount: 0,
      lastMessage: null,
    };
  }
}
