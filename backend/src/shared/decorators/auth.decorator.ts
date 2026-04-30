import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards';

export const Auth = () =>
  applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth('access-token'));
