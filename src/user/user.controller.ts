import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { Tokens } from './types/tokens.type';
import { User } from './user.model';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('/local/signup')
  async signupLocal(@Body() dto: CreateUserDto) {
    return await this.userService.signupLocal(dto);
  }

  @Post('/local/signin')
  signinLocal(@Body() dto: CreateUserDto): Promise<Tokens> {
    return this.userService.signinLocal(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req: Request) {
    const user = req.user;
    await this.userService.logout(user['sub']);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('/refresh')
  async refreshTokens(@Req() req: Request) {
    const user = req.user;
    return await this.userService.refreshTokens(
      user['sub'],
      user['refreshToken'],
    );
  }
}
