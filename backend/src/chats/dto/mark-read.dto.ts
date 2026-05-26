import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MarkReadDTO {
  @ApiProperty({ format: 'uuid', description: 'Latest message id to mark read up to' })
  @IsUUID()
  messageId: string;
}

export class MarkReadResponseDTO {
  @ApiProperty({ format: 'uuid' })
  chatId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  lastReadAt: string;
}
