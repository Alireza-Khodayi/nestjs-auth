import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    example: 'user1@website.com',
    description: 'Email must be a valid Email adress.',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'H264s140ms',
    description:
      'Password should contain atleast one upper-case , one lower-case , numbers and min length of 10 characters ',
  })
  @MinLength(10)
  password: string;
}
