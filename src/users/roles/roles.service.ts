import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role) private readonly rolesRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.createInitialRoles();
  }

  private async createInitialRoles() {
    const roles = ['admin', 'user'];
    for (const roleName of roles) {
      const existingRole = await this.rolesRepository.findOne({
        where: { roleName },
      });
      if (!existingRole) {
        const role = this.rolesRepository.create({ roleName });
        await this.rolesRepository.save(role);
        console.log(`Role created: ${roleName}`);
      }
    }
  }

  async create(createRoleDto: CreateRoleDto) {
    const newRole = this.rolesRepository.create(createRoleDto);
    await this.rolesRepository.save(newRole);
  }

  findAll() {
    return `This action returns all roles`;
  }

  async findByRoleName(roleName: string) {
    return await this.rolesRepository.findOne({
      where: { roleName },
    });
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return `This action updates a #${id} role`;
  }

  remove(id: number) {
    return `This action removes a #${id} role`;
  }
}
