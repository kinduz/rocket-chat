import { ApiProperty } from '@nestjs/swagger';
import { MessageDTO } from './message.dto';

export class SendDirectMessageResponseDTO {
  @ApiProperty({ format: 'uuid' })
  chatId: string;

  @ApiProperty({ type: MessageDTO })
  message: MessageDTO;
}
