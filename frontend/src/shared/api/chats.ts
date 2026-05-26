import { type ApiResponse as R, Resource } from './resource';

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
  fromMe: boolean;
  delivered: boolean;
  read: boolean;
};

export type MarkReadResponse = {
  chatId: string;
  lastReadAt: string;
};

export type ListMessagesParams = {
  before?: string;
  limit?: number;
};

export type SendDirectMessageResult = {
  chatId: string;
  message: ChatMessage;
};

export type ListMessagesResponse = R<ChatMessage[]>;
export type SendMessageResponse = R<ChatMessage>;
export type SendDirectMessageResponse = R<SendDirectMessageResult>;

export type LastMessagePreview = {
  text: string;
  at: string;
  fromMe: boolean;
  delivered: boolean;
  read: boolean;
};

type ChatListItemBase = {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  unreadCount: number;
};

export type ChatItem = ChatListItemBase & {
  kind: 'chat';
  phone: null;
  lastMessage: LastMessagePreview | null;
};

export type UserItem = ChatListItemBase & {
  kind: 'user';
  phone: string | null;
  lastMessage: null;
};

export type ChatListItem = ChatItem | UserItem;

export type GetChatsResponse = R<ChatListItem[]>;

export class ChatsResource extends Resource {
  async getChats(q?: string): Promise<GetChatsResponse> {
    const { data } = await this.client.get<GetChatsResponse>('/chats', {
      params: q ? { q } : undefined,
    });
    return data;
  }

  async listMessages(
    chatId: string,
    params?: ListMessagesParams,
  ): Promise<ListMessagesResponse> {
    const { data } = await this.client.get<ListMessagesResponse>(
      `/chats/${chatId}/messages`,
      { params },
    );
    return data;
  }

  async sendMessage(
    chatId: string,
    text: string,
  ): Promise<SendMessageResponse> {
    const { data } = await this.client.post<SendMessageResponse>(
      `/chats/${chatId}/messages`,
      { text },
    );
    return data;
  }

  async sendDirectMessage(
    userId: string,
    text: string,
  ): Promise<SendDirectMessageResponse> {
    const { data } = await this.client.post<SendDirectMessageResponse>(
      `/chats/direct/${userId}/messages`,
      { text },
    );
    return data;
  }

  async markRead(
    chatId: string,
    messageId: string,
  ): Promise<R<MarkReadResponse>> {
    const { data } = await this.client.post<R<MarkReadResponse>>(
      `/chats/${chatId}/read`,
      { messageId },
    );
    return data;
  }
}
