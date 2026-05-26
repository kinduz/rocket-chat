import { type ApiResponse as R, Resource } from './resource';

export type LastMessagePreview = {
  text: string;
  at: string;
  fromMe: boolean;
};

type ChatListItemBase = {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
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
}
