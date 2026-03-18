import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ description: 'User phone number' })
  @IsString()
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ description: 'OTP code' })
  @IsString()
  @Length(6, 6)
  code: string;
}
