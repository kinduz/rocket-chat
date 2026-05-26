import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiErrorCode, ApiException } from 'src/shared';
import { Repository } from 'typeorm';
import { S3Service } from '../shared/s3';
import { checkUniqueFields } from '../shared/utils/check-unique-fields';
import { User } from '../user/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileDTO } from './profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly s3: S3Service,
  ) {}

  async getProfile(id: string): Promise<ProfileDTO> {
    const profile = await this.userRepository.findOne({ where: { id } });
    if (!profile) {
      throw new ApiException(ApiErrorCode.USER_NOT_FOUND);
    }
    return this.toProfileDTO(profile);
  }

  async updateProfile(
    id: string,
    data: UpdateProfileDto,
    avatar?: Express.Multer.File,
  ): Promise<ProfileDTO> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new ApiException(ApiErrorCode.USER_NOT_FOUND);
    }

    await checkUniqueFields(this.userRepository, id, data);

    const update: Partial<User> = { ...data };

    if (avatar) {
      const previous = await this.userRepository.findOne({
        where: { id },
        select: { avatarKey: true },
      });

      const ext = extname(avatar.originalname) || '';
      const key = `avatars/${id}/${randomUUID()}${ext}`;
      const { url } = await this.s3.upload({
        key,
        body: avatar.buffer,
        contentType: avatar.mimetype,
      });

      update.avatarKey = key;
      update.avatarUrl = url;

      if (previous?.avatarKey) {
        this.s3.delete(previous.avatarKey).catch(() => undefined);
      }
    }

    await this.userRepository.update(id, update);
    Object.assign(user, update);
    return this.toProfileDTO(user);
  }

  private async toProfileDTO(user: User): Promise<ProfileDTO> {
    return {
      avatarUrl: user.avatarKey
        ? await this.s3.getPresignedDownloadUrl(user.avatarKey)
        : null,
      email: user.email,
      username: user.username,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      phone: user.phone,
    };
  }
}
