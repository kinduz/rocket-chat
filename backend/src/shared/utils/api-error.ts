import { HttpException, HttpStatus } from '@nestjs/common';

export enum ApiErrorCode {
  UNAUTHORIZED = 'unauthorized',
  BAD_REQUEST = 'bad_request',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  OTP_ALREADY_SENT = 'otp_already_sent',
  INVALID_OTP = 'invalid_otp',
  OTP_EXPIRED = 'otp_expired',
  SEND_SMS_ERROR = 'send_sms_error',
  TOO_MANY_REQUESTS = 'too_many_requests',
  UNIQUE_FIELDS_TAKEN = 'unique_fields_taken',
}

type ApiErrorDescriptor = {
  status: HttpStatus;
  message: string;
};

const API_ERRORS: Record<ApiErrorCode, ApiErrorDescriptor> = {
  [ApiErrorCode.UNAUTHORIZED]: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Unauthorized',
  },
  [ApiErrorCode.BAD_REQUEST]: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Bad request',
  },
  [ApiErrorCode.INTERNAL_SERVER_ERROR]: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
  },
  [ApiErrorCode.OTP_ALREADY_SENT]: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: 'OTP code was already sent recently',
  },
  [ApiErrorCode.INVALID_OTP]: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Invalid OTP code',
  },
  [ApiErrorCode.OTP_EXPIRED]: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'OTP code has expired',
  },
  [ApiErrorCode.SEND_SMS_ERROR]: {
    status: HttpStatus.BAD_GATEWAY,
    message: 'Failed to send SMS, please try again',
  },
  [ApiErrorCode.TOO_MANY_REQUESTS]: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: 'Too many requests',
  },
  [ApiErrorCode.UNIQUE_FIELDS_TAKEN]: {
    status: HttpStatus.CONFLICT,
    message: 'Some fields are already taken',
  },
};

export type ApiErrorBody = {
  error: ApiErrorCode;
  message: string;
  statusCode: HttpStatus;
  fields?: string[];
};

export type ApiExceptionOptions = {
  message?: string;
  fields?: string[];
};

export class ApiException extends HttpException {
  readonly code: ApiErrorCode;

  constructor(code: ApiErrorCode, options?: ApiExceptionOptions) {
    const { status, message } = API_ERRORS[code];
    const body: ApiErrorBody = {
      error: code,
      message: options?.message ?? message,
      statusCode: status,
      ...(options?.fields ? { fields: options.fields } : {}),
    };
    super(body, status);
    this.code = code;
  }
}
