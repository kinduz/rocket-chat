import type { RocketChatClient } from '@app/shared/api/client';

export async function getUserProfile(rcClient: RocketChatClient) {
  const response = await rcClient.profile.getProfile();
  if (!response.error) return response;
}
