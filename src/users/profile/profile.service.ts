import { Injectable } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from '../users.service';

@Injectable()
export class ProfileService {
  constructor(private readonly usersService: UsersService) {}

  async getProfile(userId: string) {
    return this.usersService.findOne(+userId); // Fetch user profile
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    return await this.usersService.update(+userId, updateProfileDto); // Update user profile
  }
}
