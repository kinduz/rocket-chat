import { type ApiResponse as R, Resource } from './resource';

export class ProfileResource extends Resource {
  async getProfile(): Promise<GetProfileResponse> {
    const { data } = await this.client.get<GetProfileResponse>('/profile');
    return data;
  }
}

export type Profile = {
  avatarUrl: string | null;
  email: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string;
};

export type GetProfileResponse = R<Profile>;
