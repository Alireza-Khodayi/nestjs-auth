import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';
import { REQUEST_USER_KEY } from 'src/iam/constants/iam.constants';
import { Role } from 'src/users/roles/entities/role.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const contextRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!contextRoles || contextRoles.length === 0) {
      return true; // If no roles are defined, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user: ActiveUserData = request[REQUEST_USER_KEY];

    if (!user || !user.role) {
      return false; // If user is not defined or has no role, deny access
    }

    // Check if the request is trying to modify protected properties only for this route

    const rolesArray = Array.isArray(contextRoles)
      ? contextRoles
      : [contextRoles];

    return rolesArray.some((role) => user.role.roleName === role.roleName);
  }
}
