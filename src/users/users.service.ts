import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from 'src/iam/hashing/hashing.service';
import { RolesService } from './roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly rolesService: RolesService,
    private readonly hashingService: HashingService,
  ) {}
  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return this.usersRepository.find({ where: {}, relations: ['role'] });
  }

  findOne(id: number) {
    return this.usersRepository.findOne({ where: { id }, relations: ['role'] });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.email = updateUserDto.email;
    if (updateUserDto.password) {
      user.password = await this.hashingService.hash(updateUserDto?.password);
    }
    const existingRole = await this.rolesService.findByRoleName(
      updateUserDto.role,
    );
    if (!existingRole) {
      throw new NotFoundException(
        'Role Not Found,Make sure create role first!',
      );
    }
    user.role = existingRole;
    // Save the updated user
    return this.usersRepository.save(user);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
