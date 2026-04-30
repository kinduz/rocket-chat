import { cookies } from 'next/headers';
import { ACCESS_TOKEN_KEY, RocketChatClient } from './client';

export const getRcClient = async () => {
  const serverCookies = await cookies();
  const accessToken = serverCookies.get(ACCESS_TOKEN_KEY)?.value;
  console.log('accessToken', accessToken);

  return new RocketChatClient({
    accessToken,
    baseURL: process.env.API_URL_INTERNAL ?? 'http://127.0.0.1:3001/api/v1',
  });
};
