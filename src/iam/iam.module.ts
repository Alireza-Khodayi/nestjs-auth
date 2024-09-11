import { Module } from '@nestjs/common';
import { HashingService } from './hashing/hashing.service';
import { BcryptService } from './hashing/bcrypt.service';
import { AuthenticationController } from './authentication/authentication.controller';
import { AuthenticationService } from './authentication/authentication.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticationGuard } from './authentication/guards/authentication.guard';
import { AccessTokenGuard } from './authentication/guards/access-token.guard';
import { RedisModule } from 'src/common/redis/redis.module';
import { RolesGuard } from './authorization/guards/roles.guard';
import { RefreshTokenStorage } from './authentication/storages/refresh-token.storage';
import { User } from 'src/users/entities/user.entity';
import { Role } from './roles/entities/role.entity';
import iamConfig from './config/iam.config';
import { RolesService } from './roles/roles.service';
import { RolesController } from './roles/roles.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(iamConfig),
    RedisModule,
  ],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    RolesService,
    AuthenticationService,
    AccessTokenGuard,
    RefreshTokenStorage,
  ],
  controllers: [RolesController, AuthenticationController],
  exports: [HashingService, RolesService],
})
export class IamModule {}
