import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

const makeUserRepo = (overrides: Partial<Record<string, jest.Mock>> = {}) => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn((dto) => dto),
  ...overrides,
});

async function buildService(userRepo: ReturnType<typeof makeUserRepo>) {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      UserService,
      { provide: getRepositoryToken(User), useValue: userRepo },
    ],
  }).compile();

  return module.get<UserService>(UserService);
}

describe('UserService', () => {
  const PHONE = '+79991234567';

  describe('findByPhone', () => {
    it('returns user when it exists', async () => {
      const user = { id: 'user-1', phone: PHONE };
      const repo = makeUserRepo({ findOne: jest.fn().mockResolvedValue(user) });
      const service = await buildService(repo);

      const result = await service.findByPhone(PHONE);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { phone: PHONE } });
      expect(result).toBe(user);
    });

    it('returns null when user is not found', async () => {
      const repo = makeUserRepo({ findOne: jest.fn().mockResolvedValue(null) });
      const service = await buildService(repo);

      const result = await service.findByPhone(PHONE);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates and saves user with the provided phone number', async () => {
      const savedUser = { id: 'user-new', phone: PHONE };
      const repo = makeUserRepo({ save: jest.fn().mockResolvedValue(savedUser) });
      const service = await buildService(repo);

      const result = await service.create(PHONE);

      expect(repo.create).toHaveBeenCalledWith({ phone: PHONE });
      expect(repo.save).toHaveBeenCalledWith({ phone: PHONE });
      expect(result).toBe(savedUser);
    });
  });
});
