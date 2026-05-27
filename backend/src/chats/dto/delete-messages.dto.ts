import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class DeleteMessagesDTO {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  chatId: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    required: false,
    description:
      'If omitted — delete all messages in the chat (subject to forEveryone)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  messageIds?: string[];

  @ApiProperty({
    description:
      'true → hard delete for all participants (only own messages can be hard-deleted); false → hide for current user only',
  })
  @IsBoolean()
  forEveryone: boolean;
}
