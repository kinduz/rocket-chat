import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CompleteRegistrationDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username?: string;
}
