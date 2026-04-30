import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { S3Service } from '../shared/s3';
import { checkUniqueFields } from '../shared/utils/check-unique-fields';
import { User } from '../user/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly s3: S3Service,
  ) {}

  async updateProfile(
    id: string,
    data: UpdateProfileDto,
    avatar?: Express.Multer.File,
  ): Promise<User> {
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
    return this.userRepository.findOneOrFail({ where: { id } });
  }
}
