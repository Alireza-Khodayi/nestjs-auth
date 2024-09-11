import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RolesService } from '../iam/roles/roles.service';
import { HashingService } from 'src/iam/hashing/hashing.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly rolesService: RolesService,
    private readonly hashingService: HashingService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if the user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password before saving
    const hashedPassword = await this.hashingService.hash(
      createUserDto.password,
    );

    // Determine the role
    const roleName = createUserDto.role || 'user'; // Default to 'user' if no role is provided
    const role = await this.getRoleOrThrow(roleName);

    // Create a new user instance
    const newUser = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role, // Assign the role entity
    });

    // Save the new user to the database
    return this.usersRepository.save(newUser);
  }

  findAll() {
    return this.usersRepository.find({ where: {}, relations: ['role'] });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    this.updateUserFields(user, updateUserDto);

    // Save the updated user
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);

    // Remove the user from the database
    await this.usersRepository.remove(user);
  }

  private async updateUserFields(user: User, updateUserDto: UpdateUserDto) {
    const { email, password, role } = updateUserDto;

    if (email) {
      user.email = email;
    }

    if (password) {
      user.password = await this.hashingService.hash(password);
    }

    if (role) {
      user.role = await this.getRoleOrThrow(role);
    }
  }

  private async getRoleOrThrow(roleName: string) {
    const role = await this.rolesService.findByRoleName(roleName);

    if (!role) {
      throw new NotFoundException(
        'Role not found. Please create the role first!',
      );
    }

    return role;
  }
}
