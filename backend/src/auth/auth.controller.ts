import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  AuthService,
  SendOtpResponse,
  VerifyOtpResponse,
} from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @ApiOperation({ summary: 'Send OTP code to user phone' })
  @ApiResponse({ status: 201, type: SendOtpResponse })
  sendOtp(@Body() dto: SendOtpDto): Promise<SendOtpResponse> {
    return this.authService.sendOtp(dto.phone);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP code and get JWT token' })
  @ApiResponse({ status: 201, type: VerifyOtpResponse })
  verifyOtp(@Body() dto: VerifyOtpDto): Promise<VerifyOtpResponse> {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }
}
