import { MinLength } from 'class-validator';

export class CreateRoleDto {
  @MinLength(4)
  roleName: string;
}
