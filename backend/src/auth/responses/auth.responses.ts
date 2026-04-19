import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpResponse {
  @ApiProperty({ example: 'OTP sent to +79001234567' })
  message: string;

  @ApiProperty({ example: 1, description: 'OTP TTL in minutes' })
  ttlMin: number;

  @ApiProperty({
    example: '123456',
    description: 'Only in development',
    required: false,
  })
  otp?: string;
}

export class VerifyOtpResponse {
  @ApiPropertyOptional({
    example: false,
    description: 'true — login, false — new registration',
  })
  isLogin?: boolean;

  @ApiPropertyOptional({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken?: string;

  @ApiPropertyOptional({ type: 'string' })
  message?: string;

  @ApiPropertyOptional({ type: 'boolean' })
  shouldShowUsernameForm?: boolean;
}
