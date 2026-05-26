import { ApiProperty } from '@nestjs/swagger';

export class MessageDTO {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  chatId: string;

  @ApiProperty({ format: 'uuid' })
  senderId: string;

  @ApiProperty()
  text: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;

  @ApiProperty({ description: 'true if the current user is the sender' })
  fromMe: boolean;

  @ApiProperty({
    description:
      'For fromMe=true: whether the other participant has read this message. Always false for incoming messages.',
  })
  read: boolean;
}
