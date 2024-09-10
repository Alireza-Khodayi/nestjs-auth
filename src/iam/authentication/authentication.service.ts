import {
  ConflictException,
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { RefreshTokenDto } from './dto/refresh-token-dto';
import { RefreshTokenIdsStorageService } from 'src/common/redis/services/refresh-token-ids.storage.service';
import { USER_KEY } from 'src/common/redis/constants/user-key.constant';
import { randomUUID } from 'crypto';
import { InvalidatedStoredValueException } from 'src/common/redis/utils/invalidate-stored-value.exception';
import { Role } from 'src/users/roles/entities/role.entity';

@Injectable()
export class AuthenticationService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Role) private readonly rolesRepository: Repository<Role>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly refreshTokenIdsStorageService: RefreshTokenIdsStorageService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    try {
      const user = new User();
      user.email = signUpDto.email;
      user.password = await this.hashingService.hash(signUpDto.password);
      const userRole = await this.rolesRepository.findOne({
        where: { roleName: 'user' },
      });

      if (userRole) {
        user.role = userRole;
        await this.usersRepository.save(user);
        console.log(`User created: ${user.email}`);
      } else {
        throw new Error(
          'User role does not exist. Please create the user role first.',
        );
      }
      await this.usersRepository.save(user);
    } catch (err) {
      const pgUniqueViolationErrorCode = '23505';

      if (err.code === pgUniqueViolationErrorCode) {
        throw new ConflictException();
      }
      throw err;
    }
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.usersRepository.findOne({
      where: {
        email: signInDto.email,
      },
      relations: ['role'],
    });
    if (!user) {
      throw new UnauthorizedException('User does not exists');
    }

    const isEqual = await this.hashingService.compare(
      signInDto.password,
      user.password,
    );

    if (!isEqual) {
      throw new UnauthorizedException('Password does not match');
    }

    return await this.generateTokens(user);
  }

  async generateTokens(user: User) {
    const refreshTokenId = randomUUID();
    console.log(user.role);
    const [accessToken, refreshToken] = await Promise.all([
      await this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        { email: user.email, role: user.role },
      ),
      await this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl, {
        refreshTokenId,
      }),
    ]);
    await this.refreshTokenIdsStorageService.insert(
      USER_KEY,
      user.id,
      refreshTokenId,
    );
    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub, refreshTokenId } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'> & { refreshTokenId: string }
      >(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });
      const user = await this.usersRepository.findOneByOrFail({
        id: sub,
      });
      const isValid = await this.refreshTokenIdsStorageService.validate(
        USER_KEY,
        user.id,
        refreshTokenId,
      );

      if (isValid) {
        await this.refreshTokenIdsStorageService.inValidate(USER_KEY, user.id);
      } else {
        throw new Error('Refresh token is invalid');
      }

      return this.generateTokens(user);
    } catch (err) {
      if (err instanceof InvalidatedStoredValueException) {
        throw new UnauthorizedException('Access denied');
      }
      throw new UnauthorizedException();
    }
  }

  private async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }

  async onModuleInit() {
    await this.createInitialAdminUser();
  }

  private async createInitialAdminUser() {
    const adminEmail = 'admin@example.com'; // Change this to your desired admin email
    const adminPassword = 'adminPassword'; // Change this to your desired admin password

    const existingAdmin = await this.usersRepository.findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const user = new User();
      user.email = adminEmail;
      user.password = await this.hashingService.hash(adminPassword);

      // Fetch the admin role
      const adminRole = await this.rolesRepository.findOne({
        where: { roleName: 'admin' },
      });

      if (adminRole) {
        user.role = adminRole;
        await this.usersRepository.save(user);
        console.log(user.role);
        console.log(`Admin user created: ${adminEmail}`);
      } else {
        console.error(
          'Admin role does not exist. Please create the admin role first.',
        );
      }
    }
  }
}
