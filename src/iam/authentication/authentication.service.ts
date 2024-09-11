import {
  ConflictException,
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { ActiveUserData } from '../interfaces/active-user-data.interface';
import { RefreshTokenDto } from './dto/refresh-token-dto';
import { USER_KEY } from 'src/iam/constants/user-key.constant';
import { randomUUID } from 'crypto';
import { RefreshTokenStorage } from './storages/refresh-token.storage';
import { User } from 'src/users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import iamConfig from '../config/iam.config';

@Injectable()
export class AuthenticationService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Role) private readonly rolesRepository: Repository<Role>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    @Inject(iamConfig.KEY)
    private readonly iamConfiguration: ConfigType<typeof iamConfig>,
    private readonly refreshTokenStorage: RefreshTokenStorage,
  ) {}

  async onModuleInit() {
    await this.createInitialAdminUser();
  }

  private async createInitialAdminUser() {
    const existingAdmin = await this.usersRepository.findOne({
      where: { email: this.iamConfiguration.adminEmail },
    });
    if (!existingAdmin) {
      const adminRole = await this.getUserRole(
        this.iamConfiguration.defaultAdminRoleName,
      );
      if (!adminRole) {
        console.error(
          'Admin role does not exist. Please create the admin role first.',
        );
        return;
      }
      const adminUser = await this.createUser(
        this.iamConfiguration.adminEmail,
        this.iamConfiguration.adminPassword,
        adminRole,
      );

      await this.usersRepository.save(adminUser);
    }
  }

  async signUp(signUpDto: SignUpDto) {
    const userRole = await this.getUserRole(
      this.iamConfiguration.defaultUserRoleName,
    );
    if (!userRole) {
      throw new Error(
        'User role does not exist. Please create the user role first.',
      );
    }

    const user = await this.createUser(
      signUpDto.email,
      signUpDto.password,
      userRole,
    );
    try {
      await this.usersRepository.save(user);
      console.log(`User created: ${user.email}`);
    } catch (err) {
      this.handleDatabaseViolationError(err);
    }
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.findUserByEmail(signInDto.email);
    await this.validatePassword(signInDto.password, user.password);
    return this.generateTokens(user);
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    const { sub, refreshTokenId } = await this.verifyRefreshToken(
      refreshTokenDto.refreshToken,
    );
    const user = await this.usersRepository.findOneByOrFail({ id: sub });
    await this.validateRefreshToken(user.id, refreshTokenId);
    return this.generateTokens(user);
  }

  private async generateTokens(user: User) {
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        { email: user.email, role: user.role },
      ),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl, {
        refreshTokenId,
      }),
    ]);
    await this.refreshTokenStorage.insert(USER_KEY, user.id, refreshTokenId);
    return { accessToken, refreshToken };
  }

  private async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return this.jwtService.signAsync(
      { sub: userId, ...payload },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }

  private async verifyRefreshToken(token: string) {
    return this.jwtService.verifyAsync<
      Pick<ActiveUserData, 'sub'> & { refreshTokenId: string }
    >(token, {
      secret: this.jwtConfiguration.secret,
      audience: this.jwtConfiguration.audience,
      issuer: this.jwtConfiguration.issuer,
    });
  }

  private async validateRefreshToken(userId: number, refreshTokenId: string) {
    const isValid = await this.refreshTokenStorage.validate(
      USER_KEY,
      userId,
      refreshTokenId,
    );
    if (!isValid) {
      throw new UnauthorizedException('Refresh token is invalid');
    }
    await this.refreshTokenStorage.inValidate(USER_KEY, userId);
  }

  private async findUserByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
    });
    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }
    return user;
  }

  private async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ) {
    const isEqual = await this.hashingService.compare(
      plainPassword,
      hashedPassword,
    );
    if (!isEqual) {
      throw new UnauthorizedException('Password does not match');
    }
  }

  private async getUserRole(roleName: string): Promise<Role | null> {
    return this.rolesRepository.findOne({ where: { roleName } });
  }

  private async createUser(
    email: string,
    password: string,
    role: Role,
  ): Promise<User> {
    const user = new User();
    user.email = email;
    user.password = await this.hashingService.hash(password);
    user.role = role;
    return user;
  }

  private handleDatabaseViolationError(err: any) {
    if (err.code === this.iamConfiguration.pgViolationErrorCode) {
      throw new ConflictException('A user already exists with this email!');
    }
    throw err;
  }
}
