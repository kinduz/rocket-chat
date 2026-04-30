import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth, CurrentUserID } from '../shared';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Auth()
  @Put()
  @UseInterceptors(FileInterceptor('avatar'))
  updateProfile(
    @CurrentUserID() userId: string,
    @Body() dto: UpdateProfileDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_AVATAR_SIZE }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    avatar?: Express.Multer.File,
  ) {
    return this.profileService.updateProfile(userId, dto, avatar);
  }
}
