import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ description: 'User phone number' })
  @IsString()
  @IsPhoneNumber()
  phone: string;
}
