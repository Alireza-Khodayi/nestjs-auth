import { Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ActiveUser } from 'src/iam/decorators/active-user.decorator';
import { RoleBasedUpdateUserDto } from 'src/iam/authorization/decorators/role-base-update-user-dto.decorator';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('User Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  getMe(@ActiveUser('sub') userId: string) {
    return this.profileService.getProfile(userId); // Fetch the user profile
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateMe(
    @ActiveUser('sub') userId: string,
    @RoleBasedUpdateUserDto() updateProfileDto: UpdateProfileDto,
  ) {
    return await this.profileService.updateProfile(userId, updateProfileDto); // Update user profile
  }
}
