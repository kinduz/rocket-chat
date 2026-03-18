import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { checkUniqueFields } from '../shared/utils/check-unique-fields';
import { User } from '../user/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async updateProfile(id: string, data: UpdateProfileDto): Promise<User> {
    await checkUniqueFields(this.userRepository, id, data);
    await this.userRepository.update(id, data);
    return this.userRepository.findOneOrFail({ where: { id } });
  }
}
