import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiErrorBody, ApiErrorCode, ApiException } from './api-error';

const STATUS_TO_CODE: Partial<Record<HttpStatus, ApiErrorCode>> = {
  [HttpStatus.UNAUTHORIZED]: ApiErrorCode.UNAUTHORIZED,
  [HttpStatus.BAD_REQUEST]: ApiErrorCode.BAD_REQUEST,
  [HttpStatus.TOO_MANY_REQUESTS]: ApiErrorCode.TOO_MANY_REQUESTS,
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ApiException) {
      const body = exception.getResponse() as ApiErrorBody;
      res.status(body.statusCode).json(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const message =
        typeof raw === 'string'
          ? raw
          : ((raw as { message?: string | string[] }).message ??
            exception.message);
      const body: ApiErrorBody = {
        error: STATUS_TO_CODE[status] ?? ApiErrorCode.INTERNAL_SERVER_ERROR,
        message: Array.isArray(message) ? message.join(', ') : message,
        statusCode: status,
      };
      res.status(status).json(body);
      return;
    }

    this.logger.error(exception);
    const body: ApiErrorBody = {
      error: ApiErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    };
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
