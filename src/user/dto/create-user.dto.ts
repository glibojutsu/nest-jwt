import { isEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsEmail } from 'sequelize-typescript';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
