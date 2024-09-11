import { SetMetadata } from '@nestjs/common';
import { Role } from 'src/iam/roles/entities/role.entity';

export const ROLES_KEY = 'roles';
export const Roles = (role: Partial<Role>) => SetMetadata(ROLES_KEY, role);
