import { HttpService } from '@nestjs/axios';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { OtpCode } from './entities/otp-code.entity';

const makeOtpRepo = (overrides: Partial<Record<string, jest.Mock>> = {}) => ({
  findOne: jest.fn(),
  remove: jest.fn(),
  save: jest.fn(),
  create: jest.fn((dto) => dto),
  ...overrides,
});

const makeUserService = (overrides: Partial<Record<string, jest.Mock>> = {}) => ({
  findByPhone: jest.fn(),
  create: jest.fn(),
  ...overrides,
});

const makeJwtService = () => ({
  sign: jest.fn().mockReturnValue('jwt-token'),
});

async function buildService(
  otpRepo: ReturnType<typeof makeOtpRepo>,
  userService: ReturnType<typeof makeUserService>,
  jwtService: ReturnType<typeof makeJwtService>,
) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: getRepositoryToken(OtpCode), useValue: otpRepo },
      { provide: UserService, useValue: userService },
      { provide: JwtService, useValue: jwtService },
      { provide: HttpService, useValue: {} },
    ],
  }).compile();

  return module.get<AuthService>(AuthService);
}

describe('AuthService', () => {
  const PHONE = '+79991234567';
  const CODE = '123456';

  describe('sendOtp', () => {
    it('removes existing OTP and creates a new one', async () => {
      const existedOtp = { phone: PHONE, code: '000000' };
      const otpRepo = makeOtpRepo({
        findOne: jest.fn().mockResolvedValue(existedOtp),
        remove: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const service = await buildService(otpRepo, makeUserService(), makeJwtService());

      const result = await service.sendOtp(PHONE);

      expect(otpRepo.remove).toHaveBeenCalledWith(existedOtp);
      expect(otpRepo.save).toHaveBeenCalledTimes(1);
      expect(result.ttlMin).toBe(1);
      expect(result.otp).toMatch(/^\d{6}$/);
      expect(result.message).toContain(PHONE);
    });

    it('creates OTP when no previous one exists', async () => {
      const otpRepo = makeOtpRepo({
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const service = await buildService(otpRepo, makeUserService(), makeJwtService());

      await service.sendOtp(PHONE);

      expect(otpRepo.remove).not.toHaveBeenCalled();
      expect(otpRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('verifyOtp', () => {
    it('throws UnauthorizedException when OTP not found', async () => {
      const otpRepo = makeOtpRepo({ findOne: jest.fn().mockResolvedValue(null) });
      const service = await buildService(otpRepo, makeUserService(), makeJwtService());

      await expect(service.verifyOtp(PHONE, CODE)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when code is incorrect', async () => {
      const otpRepo = makeOtpRepo({
        findOne: jest.fn().mockResolvedValue({
          phone: PHONE,
          code: '999999',
          expiresAt: new Date(Date.now() + 60_000),
        }),
      });
      const service = await buildService(otpRepo, makeUserService(), makeJwtService());

      await expect(service.verifyOtp(PHONE, CODE)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('removes expired OTP, creates a new one and returns a message', async () => {
      const expiredOtp = {
        phone: PHONE,
        code: CODE,
        expiresAt: new Date(Date.now() - 1),
      };
      const otpRepo = makeOtpRepo({
        findOne: jest.fn().mockResolvedValue(expiredOtp),
        remove: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
      });
      const service = await buildService(otpRepo, makeUserService(), makeJwtService());

      const result = await service.verifyOtp(PHONE, CODE);

      expect(otpRepo.remove).toHaveBeenCalledWith(expiredOtp);
      expect(otpRepo.save).toHaveBeenCalledTimes(1);
      expect(result.message).toContain('expired');
      expect(result.accessToken).toBeUndefined();
    });

    it('creates a new user and returns a token when OTP is valid', async () => {
      const validOtp = {
        phone: PHONE,
        code: CODE,
        expiresAt: new Date(Date.now() + 60_000),
      };
      const otpRepo = makeOtpRepo({
        findOne: jest.fn().mockResolvedValue(validOtp),
        remove: jest.fn().mockResolvedValue(undefined),
      });
      const newUser = { id: 'user-1', phone: PHONE };
      const userService = makeUserService({
        findByPhone: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(newUser),
      });
      const jwtService = makeJwtService();
      const service = await buildService(otpRepo, userService, jwtService);

      const result = await service.verifyOtp(PHONE, CODE);

      expect(userService.create).toHaveBeenCalledWith(PHONE);
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: newUser.id, phone: PHONE });
      expect(result.accessToken).toBe('jwt-token');
    });

    it('uses existing user and does not create a new one when OTP is valid', async () => {
      const validOtp = {
        phone: PHONE,
        code: CODE,
        expiresAt: new Date(Date.now() + 60_000),
      };
      const otpRepo = makeOtpRepo({
        findOne: jest.fn().mockResolvedValue(validOtp),
        remove: jest.fn().mockResolvedValue(undefined),
      });
      const existingUser = { id: 'user-existing', phone: PHONE };
      const userService = makeUserService({
        findByPhone: jest.fn().mockResolvedValue(existingUser),
        create: jest.fn(),
      });
      const service = await buildService(otpRepo, userService, makeJwtService());

      const result = await service.verifyOtp(PHONE, CODE);

      expect(userService.create).not.toHaveBeenCalled();
      expect(result.accessToken).toBe('jwt-token');
    });
  });
});
