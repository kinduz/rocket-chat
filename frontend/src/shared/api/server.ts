import { cookies } from 'next/headers';
import { ACCESS_TOKEN_KEY, RocketChatClient } from './client';

export const getRcClient = async () => {
  const serverCookies = await cookies();
  const accessToken = serverCookies.get(ACCESS_TOKEN_KEY)?.value;
 
  return new RocketChatClient({
    accessToken,
    baseURL: process.env.API_URL_INTERNAL ?? 'http://host.docker.internal:3001/api/v1',
  });
};
