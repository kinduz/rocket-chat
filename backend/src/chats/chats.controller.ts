import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Auth, CurrentUserID } from '../shared';
import { ChatsService } from './chats.service';
import {
  ListMessagesDTO,
  MarkReadDTO,
  MarkReadResponseDTO,
  MessageDTO,
  SearchItemDTO,
  SendDirectMessageResponseDTO,
  SendMessageDTO,
} from './dto';

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

  @Auth()
  @Get(':chatId/messages')
  @ApiOperation({ summary: 'List messages of a chat (oldest → newest)' })
  @ApiOkResponse({ type: MessageDTO, isArray: true })
  listMessages(
    @CurrentUserID() userId: string,
    @Param('chatId', new ParseUUIDPipe()) chatId: string,
    @Query() query: ListMessagesDTO,
  ): Promise<MessageDTO[]> {
    return this.chatsService.listMessages(userId, chatId, query);
  }

  @Auth()
  @Post(':chatId/messages')
  @ApiOperation({ summary: 'Send a message to an existing chat' })
  @ApiCreatedResponse({ type: MessageDTO })
  sendMessage(
    @CurrentUserID() userId: string,
    @Param('chatId', new ParseUUIDPipe()) chatId: string,
    @Body() dto: SendMessageDTO,
  ): Promise<MessageDTO> {
    return this.chatsService.sendMessage(userId, chatId, dto.text);
  }

  @Auth()
  @Post(':chatId/read')
  @ApiOperation({
    summary: 'Mark messages in a chat as read up to a given message',
  })
  @ApiCreatedResponse({ type: MarkReadResponseDTO })
  markRead(
    @CurrentUserID() userId: string,
    @Param('chatId', new ParseUUIDPipe()) chatId: string,
    @Body() dto: MarkReadDTO,
  ): Promise<MarkReadResponseDTO> {
    return this.chatsService.markRead(userId, chatId, dto.messageId);
  }

  @Auth()
  @Post('direct/:userId/messages')
  @ApiOperation({
    summary:
      'Send a first message to a user, creating a direct chat if it does not exist',
  })
  @ApiCreatedResponse({ type: SendDirectMessageResponseDTO })
  sendDirectMessage(
    @CurrentUserID() viewerId: string,
    @Param('userId', new ParseUUIDPipe()) otherUserId: string,
    @Body() dto: SendMessageDTO,
  ): Promise<SendDirectMessageResponseDTO> {
    return this.chatsService.sendDirectMessage(viewerId, otherUserId, dto.text);
  }
}
