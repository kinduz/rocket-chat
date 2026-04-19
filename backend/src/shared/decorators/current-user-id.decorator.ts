import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { ApiErrorCode, ApiException } from '../utils';

const extractToken = (req: Request): string | null => {
  const [type, token] = req.headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' && token ? token : null;
};

export const CurrentUserID = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = extractToken(req);
    if (!token) {
      throw new ApiException(ApiErrorCode.UNAUTHORIZED, {
        message: 'Token not provided',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new ApiException(ApiErrorCode.INTERNAL_SERVER_ERROR, {
        message: 'JWT_SECRET is not configured',
      });
    }

    try {
      const payload = jwt.verify(token, secret) as JwtPayload;
      if (!payload.sub) {
        throw new ApiException(ApiErrorCode.UNAUTHORIZED);
      }
      return payload.sub;
    } catch (err) {
      if (err instanceof ApiException) throw err;
      throw new ApiException(ApiErrorCode.UNAUTHORIZED, {
        message: 'Invalid or expired token',
      });
    }
  },
);
