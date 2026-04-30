import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Auth, CurrentUserID } from '../shared';
import { ChatsService } from './chats.service';
import { SearchItemDTO } from './dto';

@ApiTags('chats')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Auth()
  @Get()
  @ApiOperation({
    summary: 'List user chats with optional search',
    description:
      'Without q - returns user chats. With q - also appends users without an existing direct chat.',
  })
  @ApiQuery({ name: 'q', required: false })
  @ApiOkResponse({ type: SearchItemDTO, isArray: true })
  getChats(
    @CurrentUserID() userId: string,
    @Query('q') q?: string,
  ): Promise<SearchItemDTO[]> {
    return this.chatsService.getChats(userId, q);
  }
}
