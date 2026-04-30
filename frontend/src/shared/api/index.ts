import { RocketChatClient } from './client';

export * from './auth';
export { ACCESS_TOKEN_KEY } from './client';
export * from './profile';
export { ApiErrorCode, type ApiErrorData, type ApiResponse } from './resource';

export const rcClient = new RocketChatClient();
export const useRCClient = () => rcClient;
