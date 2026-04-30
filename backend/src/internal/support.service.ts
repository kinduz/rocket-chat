import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatsService } from '../chats/chats.service';
import { User, UserRole } from '../user/entities/user.entity';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly config: ConfigService,
    private readonly chats: ChatsService,
  ) {}

  async findSupport(): Promise<User | null> {
    return this.userRepository.findOne({
      where: { role: UserRole.SUPPORT },
    });
  }

  async createSupport(): Promise<User> {
    const existing = await this.findSupport();
    if (existing) return existing;

    return this.userRepository.save(
      this.userRepository.create({
        role: UserRole.SUPPORT,
        phone: this.config.get<string>('SUPPORT_PHONE', '+00000000000'),
        username: this.config.get<string>('SUPPORT_USERNAME', 'support'),
        email: this.config.get<string>('SUPPORT_EMAIL') ?? undefined,
      }),
    );
  }

  async deleteSupport(): Promise<void> {
    const support = await this.findSupport();
    if (!support) throw new NotFoundException('Support account not found');

    await this.chats.deleteUserChats(support.id);
    await this.userRepository.delete(support.id);
  }

  async onboardUser(newUserId: string): Promise<void> {
    const support = await this.findSupport();
    if (!support) {
      this.logger.warn(
        `No support account found — skipping onboarding for user ${newUserId}`,
      );
      return;
    }
    if (support.id === newUserId) return;

    await this.chats.findOrCreateDirectChat(newUserId, support.id);
  }
}
