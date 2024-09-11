import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Roles } from 'src/iam/authorization/decorators/roles.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('User Roles')
@Roles({ roleName: 'admin' })
@Controller('iam/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  async findAll() {
    console.log('Fetching all roles');
    return await this.rolesService.findAll();
  }

  @HttpCode(HttpStatus.OK)
  @Get(':role')
  findByRoleName(@Param('role') roleName: string) {
    return this.rolesService.findByRoleName(roleName);
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(+id, updateRoleDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolesService.remove(+id);
  }
}
