import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { ERRORS_MSG } from 'src/shared';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { OtpCode } from './entities/otp-code.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { SendOtpResponse, VerifyOtpResponse } from './responses/auth.responses';

export { SendOtpResponse, VerifyOtpResponse };

const OTP_TTL_MINUTES = 1;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(OtpCode)
    private readonly otpRepository: Repository<OtpCode>,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
  ) {}

  async sendOtp(phone: string): Promise<SendOtpResponse> {
    const existedOtp = await this.otpRepository.findOne({
      where: { phone },
    });

    if (existedOtp) {
      if (existedOtp.expiresAt < new Date()) {
        await this.otpRepository.remove(existedOtp);
      } else {
        throw new UnauthorizedException('OTP already sent');
      }
    }

    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.otpRepository.save(
      this.otpRepository.create({ phone, code, expiresAt }),
    );

    console.log(`[OTP] ${phone} → ${code}`);

    const isDev = process.env.NODE_ENV !== 'production';

    await this.sendSMSToUser(code, phone.split('+')[1]);

    return {
      message: `OTP sent to ${phone}`,
      ttlMin: OTP_TTL_MINUTES,
      ...(isDev && { otp: code }),
    };
  }

  async verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
    const otp = await this.otpRepository.findOne({
      where: { phone },
    });

    if (!otp) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    if (otp.expiresAt < new Date()) {
      await this.otpRepository.remove(otp);
      const code = this.generateOtp();
      const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

      await this.otpRepository.save(
        this.otpRepository.create({ phone, code, expiresAt }),
      );

      return {
        message: `OTP expired. New OTP sent to ${phone}`,
      };
    }

    if (otp.code !== code) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    await this.otpRepository.remove(otp);

    let user = await this.userService.findByPhone(phone);
    if (!user) {
      user = await this.userService.create(phone);
    }

    return {
      accessToken: this.signToken(user.id, user.phone),
    };
  }

  private signToken(userId: string, phone: string): string {
    const payload: JwtPayload = { sub: userId, phone };
    return this.jwtService.sign(payload);
  }

  private generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private sendSMSToUser = async (otp: string, destination: string) => {
    const {
      EXOLVE_API_KEY: api_key,
      EXOLVE_API_BASE_URL: baseUrl,
      EXOLVE_API_SENDER_PHONE_NUMBER: senderPhoneNumber,
    } = process.env;

    const url = `${baseUrl}/SendSMS`;

    const text = `Ваш код подтверждения в Rocket Chat: ${otp}`;

    const body = {
      number: senderPhoneNumber,
      destination,
      text,
    };

    const headers = {
      Authorization: `Bearer ${api_key}`,
      'Content-Type': 'application/json',
    };

    try {
      const data = this.httpService.post(url, body, { headers });
      console.log(await lastValueFrom(data));

      return;
    } catch (e) {
      console.error('Error: ', e.response.data.error, destination);
      throw new BadRequestException(ERRORS_MSG.SEND_SMS_ERROR);
    }
  };
}
