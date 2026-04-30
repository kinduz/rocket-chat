import { ApiProperty } from '@nestjs/swagger';

export class LastMessagePreviewDTO {
  @ApiProperty()
  text: string;

  @ApiProperty({ type: String, format: 'date-time' })
  at: string;

  @ApiProperty({ description: 'Did the current user send the last message' })
  fromMe: boolean;
}

export class SearchItemDTO {
  @ApiProperty({
    enum: ['chat', 'user'],
    description:
      'chat - existing chat (top of the list); user - user without a chat yet (bottom)',
  })
  kind: 'chat' | 'user';

  @ApiProperty({
    format: 'uuid',
    description: 'chatId when kind=chat, userId when kind=user',
  })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({
    type: LastMessagePreviewDTO,
    nullable: true,
    description: 'Only set for kind=chat',
  })
  lastMessage: LastMessagePreviewDTO | null;
}
