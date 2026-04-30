import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SupportAccountDTO } from './dto';
import { InternalGuard } from './internal.guard';
import { SupportService } from './support.service';

@ApiTags('internal')
@ApiHeader({
  name: 'x-internal-token',
  required: true,
  description: 'Internal API token',
})
@UseGuards(InternalGuard)
@Controller('internal')
export class InternalController {
  constructor(private readonly supportService: SupportService) {}

  @Post('support')
  @ApiOperation({ summary: 'Create the support account' })
  @ApiOkResponse({ type: SupportAccountDTO })
  async createSupport(): Promise<SupportAccountDTO> {
    const u = await this.supportService.createSupport();
    return {
      id: u.id,
      phone: u.phone,
      username: u.username ?? null,
      email: u.email ?? null,
      role: u.role,
    };
  }

  @Delete('support')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete the support account and all its direct chats',
  })
  @ApiNoContentResponse()
  async deleteSupport(): Promise<void> {
    await this.supportService.deleteSupport();
  }
}
