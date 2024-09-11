import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';
import { REQUEST_USER_KEY } from 'src/iam/constants/iam.constants';

export const RoleBasedUpdateUserDto = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: ActiveUserData = request[REQUEST_USER_KEY];
    const updateUserDto = request.body;

    // Check if the user is an admin
    if (user.role.roleName !== 'admin') {
      // If not an admin, delete the role property from the updateUserDto
      delete updateUserDto.role;
    }

    return updateUserDto; // Return the modified updateUserDto
  },
);
