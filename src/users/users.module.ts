import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { ProfileController } from './profile/profile.controller';
import { ProfileService } from './profile/profile.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from '../iam/roles/entities/role.entity';
import { UsersService } from './users.service';
import { IamModule } from 'src/iam/iam.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), IamModule],
  controllers: [UsersController, ProfileController],
  providers: [UsersService, ProfileService],
  exports: [],
})
export class UsersModule {}
