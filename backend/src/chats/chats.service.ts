import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiErrorCode, ApiException } from 'src/shared';
import { In, Repository } from 'typeorm';
import { S3Service } from '../shared/s3';
import { User } from '../user/entities/user.entity';
import { ChatsGateway } from './chats.gateway';
import { MessageDTO, SearchItemDTO } from './dto';
import { Chat, ChatMember, Message, MessageHide } from './entities';

type ChatRow = {
  c_id: string;
  c_type: 'direct' | 'group';
  c_name: string | null;
  c_lastMessageText: string | null;
  c_lastMessageAt: Date | null;
  c_lastMessageSenderId: string | null;
  c_lastMessageDeliveredAt: Date | null;
  c_lastMessageReadAt: Date | null;
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
    @InjectRepository(MessageHide)
    private readonly messageHideRepository: Repository<MessageHide>,
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
    const qb = this.messageRepository
      .createQueryBuilder('m')
      .where('m.chat_id = :chatId', { chatId })
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM message_hides h
          WHERE h.message_id = m.id AND h.user_id = :userId
        )`,
        { userId },
      )
      .orderBy('m.createdAt', 'DESC')
      .take(limit);
    if (opts?.before) {
      qb.andWhere('m.createdAt < :before', { before: new Date(opts.before) });
    }

    const [rows, otherReceiptTimes] = await Promise.all([
      qb.getMany(),
      this.getOtherReceiptTimes(userId, chatId),
    ]);

    await this.markIncomingDelivered(userId, chatId, rows);

    return rows
      .reverse()
      .map((m) => this.toMessageDTO(m, userId, otherReceiptTimes));
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
    const shouldUpdateDelivered =
      !member.lastDeliveredAt || member.lastDeliveredAt < next;
    const shouldUpdateRead = !member.lastReadAt || member.lastReadAt < next;

    if (shouldUpdateDelivered || shouldUpdateRead) {
      if (shouldUpdateDelivered) {
        member.lastDeliveredAt = next;
      }
      member.lastReadAt = next;
      await this.chatMemberRepository.save(member);

      const recipients = await this.getOtherMemberIds(chatId, userId);
      if (shouldUpdateDelivered) {
        this.gateway.emitChatDelivered(
          {
            chatId,
            userId,
            lastDeliveredAt: next.toISOString(),
          },
          recipients,
        );
      }
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

  private async markIncomingDelivered(
    userId: string,
    chatId: string,
    messages: Message[],
  ): Promise<void> {
    const latestIncoming = messages
      .filter((m) => m.senderId !== userId)
      .reduce<Message | null>((latest, message) => {
        if (!latest || message.createdAt > latest.createdAt) return message;
        return latest;
      }, null);

    if (!latestIncoming) return;
    await this.markDeliveredAt(userId, chatId, latestIncoming.createdAt);
  }

  private async markDeliveredAt(
    userId: string,
    chatId: string,
    deliveredAt: Date,
  ): Promise<void> {
    const member = await this.chatMemberRepository.findOne({
      where: { chatId, userId },
    });
    if (!member) return;
    if (member.lastDeliveredAt && member.lastDeliveredAt >= deliveredAt) return;

    member.lastDeliveredAt = deliveredAt;
    await this.chatMemberRepository.save(member);

    const recipients = await this.getOtherMemberIds(chatId, userId);
    this.gateway.emitChatDelivered(
      {
        chatId,
        userId,
        lastDeliveredAt: deliveredAt.toISOString(),
      },
      recipients,
    );
  }

  private async getOtherReceiptTimes(
    viewerId: string,
    chatId: string,
  ): Promise<{ deliveredAt: Date | null; readAt: Date | null }> {
    const others = await this.chatMemberRepository.find({
      where: { chatId },
    });
    let deliveredAt: Date | null = null;
    let readAt: Date | null = null;
    for (const m of others) {
      if (m.userId === viewerId) continue;
      if (
        m.lastDeliveredAt &&
        (!deliveredAt || m.lastDeliveredAt > deliveredAt)
      ) {
        deliveredAt = m.lastDeliveredAt;
      }
      if (m.lastReadAt && (!readAt || m.lastReadAt > readAt)) {
        readAt = m.lastReadAt;
      }
    }
    return { deliveredAt, readAt };
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

    const senderMember = await this.chatMemberRepository.findOne({
      where: { chatId, userId: senderId },
    });
    if (senderMember) {
      let changed = false;
      if (!senderMember.lastReadAt || senderMember.lastReadAt < saved.createdAt) {
        senderMember.lastReadAt = saved.createdAt;
        changed = true;
      }
      if (
        !senderMember.lastDeliveredAt ||
        senderMember.lastDeliveredAt < saved.createdAt
      ) {
        senderMember.lastDeliveredAt = saved.createdAt;
        changed = true;
      }
      if (changed) await this.chatMemberRepository.save(senderMember);
    }

    const dto = this.toMessageDTO(saved, senderId, null);
    const recipients = await this.getOtherMemberIds(chatId, senderId);
    this.gateway.emitNewMessageToUser(dto, senderId);
    await Promise.all(
      this.gateway
        .getOnlineUserIds(recipients)
        .map((userId) => this.markDeliveredAt(userId, chatId, saved.createdAt)),
    );
    for (const userId of recipients) {
      this.gateway.emitNewMessageToUser(
        this.toMessageDTO(saved, userId, null),
        userId,
      );
    }
    return dto;
  }

  private toMessageDTO(
    message: Message,
    viewerId: string,
    otherReceiptTimes: { deliveredAt: Date | null; readAt: Date | null } | null,
  ): MessageDTO {
    const fromMe = message.senderId === viewerId;
    const delivered =
      fromMe &&
      !!otherReceiptTimes?.deliveredAt &&
      otherReceiptTimes.deliveredAt >= message.createdAt;
    const read =
      fromMe &&
      !!otherReceiptTimes?.readAt &&
      otherReceiptTimes.readAt >= message.createdAt;
    return {
      id: message.id,
      chatId: message.chatId,
      senderId: message.senderId,
      text: message.text,
      createdAt: message.createdAt.toISOString(),
      editedAt: message.editedAt ? message.editedAt.toISOString() : null,
      fromMe,
      delivered,
      read,
    };
  }

  async editMessage(
    userId: string,
    chatId: string,
    messageId: string,
    rawText: string,
  ): Promise<MessageDTO> {
    await this.ensureMembership(userId, chatId);

    const message = await this.messageRepository.findOne({
      where: { id: messageId, chatId },
    });
    if (!message) {
      throw new ApiException(ApiErrorCode.BAD_REQUEST, {
        message: 'Message does not belong to this chat',
      });
    }
    if (message.senderId !== userId) {
      throw new ApiException(ApiErrorCode.FORBIDDEN);
    }

    const text = rawText.trim();
    if (!text) {
      throw new ApiException(ApiErrorCode.BAD_REQUEST, {
        message: 'Text cannot be empty',
      });
    }

    message.text = text;
    message.editedAt = new Date();
    const saved = await this.messageRepository.save(message);

    const chat = await this.chatRepository.findOne({ where: { id: chatId } });
    if (chat?.lastMessageId === saved.id) {
      await this.chatRepository.update(chatId, { lastMessageText: text });
    }

    const memberIds = await this.getAllMemberIds(chatId);
    for (const memberId of memberIds) {
      this.gateway.emitMessageUpdatedToUser(
        this.toMessageDTO(saved, memberId, null),
        memberId,
      );
    }

    return this.toMessageDTO(saved, userId, null);
  }

  async deleteMessages(
    userId: string,
    chatId: string,
    forEveryone: boolean,
    messageIds?: string[],
  ): Promise<{ deletedIds: string[] }> {
    await this.ensureMembership(userId, chatId);

    const chatWide = !messageIds?.length;
    const messages = chatWide
      ? await this.messageRepository.find({ where: { chatId } })
      : await this.messageRepository.find({
          where: { id: In(messageIds), chatId },
        });

    if (messages.length === 0) return { deletedIds: [] };

    const own = messages.filter((m) => m.senderId === userId);
    const others = messages.filter((m) => m.senderId !== userId);

    if (forEveryone && !chatWide && others.length > 0) {
      throw new ApiException(ApiErrorCode.FORBIDDEN, {
        message: 'You can hard-delete only your own messages',
      });
    }

    const members = await this.chatMemberRepository.find({ where: { chatId } });

    // Chat-wide "for everyone" wipes the entire chat for all participants.
    // Otherwise: own messages hard-delete (forEveryone) or hidden-for-self (else).
    const hardDeleted = forEveryone
      ? chatWide
        ? messages
        : own
      : [];
    const hiddenForSelf = forEveryone
      ? chatWide
        ? []
        : others
      : messages;

    const hardIds = hardDeleted.map((m) => m.id);
    const hiddenIds = hiddenForSelf.map((m) => m.id);

    if (hardIds.length) {
      await this.messageRepository.delete({ id: In(hardIds) });
      await this.messageHideRepository.delete({ messageId: In(hardIds) });
    }
    if (hiddenIds.length) {
      const rows = hiddenIds.map((id) =>
        this.messageHideRepository.create({ userId, messageId: id, chatId }),
      );
      await this.messageHideRepository
        .createQueryBuilder()
        .insert()
        .values(rows)
        .orIgnore()
        .execute();
    }

    if (chatWide && forEveryone) {
      await this.messageHideRepository.delete({ chatId });
      await this.chatMemberRepository.delete({ chatId });
      await this.chatRepository.delete(chatId);
    } else {
      await this.refreshChatLastMessage(chatId);
    }

    // WS: other members only see hard-deleted ids; self sees everything affected.
    if (hardIds.length) {
      for (const m of members) {
        if (m.userId === userId) continue;
        const wasUnread = hardDeleted.filter(
          (msg) =>
            msg.senderId !== m.userId &&
            (!m.lastReadAt || msg.createdAt > m.lastReadAt),
        ).length;
        this.gateway.emitMessagesDeletedToUser(
          { chatId, messageIds: hardIds, unreadDecrement: wasUnread },
          m.userId,
        );
      }
    }

    const selfAffected = [...hardIds, ...hiddenIds];
    if (selfAffected.length) {
      const selfMember = members.find((mm) => mm.userId === userId);
      const wasUnread = messages.filter((msg) => {
        if (!selfAffected.includes(msg.id)) return false;
        if (msg.senderId === userId) return false;
        return !selfMember?.lastReadAt || msg.createdAt > selfMember.lastReadAt;
      }).length;
      this.gateway.emitMessagesDeletedToUser(
        { chatId, messageIds: selfAffected, unreadDecrement: wasUnread },
        userId,
      );
    }

    // Chat-wide for everyone — notify every member that the chat is gone.
    if (chatWide && forEveryone) {
      for (const m of members) {
        this.gateway.emitChatDeletedToUser({ chatId }, m.userId);
      }
    }

    return { deletedIds: selfAffected };
  }

  private async refreshChatLastMessage(chatId: string): Promise<void> {
    const prev = await this.messageRepository.findOne({
      where: { chatId },
      order: { createdAt: 'DESC' },
    });
    await this.chatRepository.update(chatId, {
      lastMessageId: prev?.id ?? null,
      lastMessageText: prev?.text ?? null,
      lastMessageSenderId: prev?.senderId ?? null,
      lastMessageAt: prev?.createdAt ?? null,
    });
  }

  private async getAllMemberIds(chatId: string): Promise<string[]> {
    const rows = await this.chatMemberRepository.find({
      where: { chatId },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
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
        'other.last_delivered_at AS "c_lastMessageDeliveredAt"',
        'other.last_read_at AS "c_lastMessageReadAt"',
        `(
          SELECT COUNT(*)::int FROM messages m
          WHERE m.chat_id = c.id
            AND m.sender_id != :userId
            AND m.created_at > COALESCE(me.last_read_at, 'epoch'::timestamptz)
            AND NOT EXISTS (
              SELECT 1 FROM message_hides h
              WHERE h.message_id = m.id AND h.user_id = :userId
            )
        ) AS "c_unreadCount"`,
        'u.username AS u_username',
        'u.first_name AS "u_firstName"',
        'u.last_name AS "u_lastName"',
        'u.avatar_key AS "u_avatarKey"',
      ])
      .andWhere(
        `EXISTS (
          SELECT 1 FROM messages m
          WHERE m.chat_id = c.id
            AND NOT EXISTS (
              SELECT 1 FROM message_hides h
              WHERE h.message_id = m.id AND h.user_id = :userId
            )
        )`,
        { userId },
      )
      .orderBy('c.last_message_at', 'DESC', 'NULLS LAST')
      .limit(50);

    if (like) {
      chatQB.andWhere(
        `((c.type = 'direct' AND (
            u.username ILIKE :like OR
            u.email ILIKE :like OR
            u.first_name ILIKE :like OR
            u.last_name ILIKE :like
          ))
         OR (c.type = 'group' AND c.name ILIKE :like))`,
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
            delivered:
              row.c_lastMessageSenderId === userId &&
              !!row.c_lastMessageDeliveredAt &&
              !!row.c_lastMessageAt &&
              row.c_lastMessageDeliveredAt >= row.c_lastMessageAt,
            read:
              row.c_lastMessageSenderId === userId &&
              !!row.c_lastMessageReadAt &&
              !!row.c_lastMessageAt &&
              row.c_lastMessageReadAt >= row.c_lastMessageAt,
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
