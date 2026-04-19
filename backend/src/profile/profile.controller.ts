import { Body, Controller, Put } from '@nestjs/common';
import { Auth, CurrentUserID } from '../shared';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Auth()
  @Put()
  updateProfile(
    @CurrentUserID() userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, dto);
  }
}
