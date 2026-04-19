import { type ApiResponse as R, Resource } from './resource';

export class AuthResource extends Resource {
  async sendOtp(req: SendOtpRequest): Promise<SendOtpResponse> {
    const { data } = await this.client.post<SendOtpResponse>(
      '/auth/send-otp',
      req,
    );
    return data;
  }

  async verifyOtp(req: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const { data } = await this.client.post<VerifyOtpResponse>(
      '/auth/verify-otp',
      req,
    );
    return data;
  }

  async updateProfile(req: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const { data } = await this.client.put<UpdateProfileResponse>(
      '/profile',
      req,
    );
    return data;
  }
}

export type SendOtpRequest = {
  phone: string;
};

export type SendOtpResponse = R<{
  message: string;
  ttlMin: number;
  otp?: string;
}>;

export type VerifyOtpRequest = {
  phone: string;
  code: string;
};

export type VerifyOtpResponse = R<{
  accessToken?: string;
  message?: string;
  shouldShowUsernameForm?: boolean;
}>;

export type UpdateProfileRequest = {
  email?: string;
  username?: string;
};

export type UpdateProfileResponse = R<{ success: boolean }>;
