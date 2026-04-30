import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class InternalGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const expected = this.config.getOrThrow<string>('INTERNAL_API_TOKEN');
    const provided = req.headers['x-internal-token'];
    if (provided !== expected) {
      throw new ForbiddenException();
    }
    return true;
  }
}
