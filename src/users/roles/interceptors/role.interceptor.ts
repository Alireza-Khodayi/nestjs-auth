import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RoleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assuming user is attached to the request

    // Check if the user is not an admin
    if (user.role !== 'admin') {
      // Exclude the role field from the request body
      const { role, ...updatedUserDto } = request.body;
      request.body = updatedUserDto; // Update the request body
    }

    return next.handle();
  }
}
