import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import iamConfig from '../config/iam.config';
import { ConfigType } from '@nestjs/config';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @Inject(iamConfig.KEY)
    private readonly iamConfiguration: ConfigType<typeof iamConfig>,
  ) {}

  async onModuleInit() {
    await this.createInitialRoles();
  }

  private async createInitialRoles() {
    const roles = [
      this.iamConfiguration.defaultAdminRoleName,
      this.iamConfiguration.defaultUserRoleName,
    ];
    for (const roleName of roles) {
      if (!(await this.findByRoleName(roleName))) {
        await this.create({ roleName });
      }
    }
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const newRole = this.roleRepository.create(createRoleDto);
    return await this.roleRepository.save(newRole);
  }

  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find({ relations: ['users'] });
  }

  async findByRoleName(roleName: string): Promise<Role | null> {
    return await this.roleRepository.findOne({
      where: { roleName },
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Update the role properties
    Object.assign(role, updateRoleDto);
    return await this.roleRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    await this.roleRepository.remove(role);
  }

  private async findById(id: number): Promise<Role | null> {
    return await this.roleRepository.findOne({ where: { id } });
  }
}
