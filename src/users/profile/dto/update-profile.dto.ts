import { PartialType } from '@nestjs/swagger';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

export class UpdateProfileDto extends PartialType(UpdateUserDto) {}
