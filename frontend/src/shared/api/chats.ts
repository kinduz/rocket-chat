import { type ApiResponse as R, Resource } from './resource';

export type LastMessagePreview = {
  text: string;
  at: string;
  fromMe: boolean;
};

export type ChatListItem = {
  kind: 'chat' | 'user';
  id: string;
  name: string;
  avatarUrl: string | null;
  lastMessage: LastMessagePreview | null;
};

export type GetChatsResponse = R<ChatListItem[]>;

export class ChatsResource extends Resource {
  async getChats(q?: string): Promise<GetChatsResponse> {
    const { data } = await this.client.get<GetChatsResponse>('/chats', {
      params: q ? { q } : undefined,
    });
    return data;
  }
}
