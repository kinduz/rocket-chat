import type { AxiosInstance } from 'axios';

export type ApiErrorData = {
  error: ApiErrorCode;
  message: string;
  statusCode?: number;
};

export type ApiResponse<T> =
  T extends number | string | null | boolean
    ? T
    : (T & { error?: undefined }) | ApiErrorData;

export type Client = AxiosInstance;

export abstract class Resource {
  constructor(protected client: Client) {
    for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
      if (method === 'constructor') continue;
      // @ts-expect-error dynamic method binding
      if (typeof this[method] !== 'function') continue;
      // @ts-expect-error dynamic method binding
      this[method] = this[method].bind(this);
    }
  }
}

export enum ApiErrorCode {
  UNAUTHORIZED = 'unauthorized',
  BAD_REQUEST = 'bad_request',
  INTERNAL_SERVER_ERROR = 'internal_server_error',
  OTP_ALREADY_SENT = 'otp_already_sent',
  INVALID_OTP = 'invalid_otp',
  OTP_EXPIRED = 'otp_expired',
  SEND_SMS_ERROR = 'send_sms_error',
  TOO_MANY_REQUESTS = 'too_many_requests',
}
