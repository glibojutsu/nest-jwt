import {
  ForbiddenException,
  Inject,
  Injectable,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { compare, hash } from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { Tokens } from './types/tokens.type';
import { User } from './user.model';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_REPOSITORY') private readonly userRepository: typeof User,
    private jwtService: JwtService,
  ) {}

  async hashData(data: string): Promise<string> {
    return await hash(data, 10);
  }

  async getTokens(userId: string, email: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: process.env.JWTKEY,
          expiresIn: process.env.TOKEN_EXPIRATION,
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: process.env.JWTKEYREFRESH,
          expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
        },
      ),
    ]);
    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async signupLocal(dto: CreateUserDto) {
    const newUser = {
      email: dto.email,
      hash: await this.hashData(dto.password),
    };
    const user = await this.userRepository.create(newUser);

    const tokens = await this.getTokens(user.id, user.email);

    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async updateRtHash(userId: string, rt: string): Promise<void> {
    const hash = await this.hashData(rt);
    await this.userRepository.update(
      { hashedRt: hash },
      { where: { id: userId } },
    );
  }

  async signinLocal(dto: CreateUserDto): Promise<Tokens> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new ForbiddenException('No such user');
    }

    const passwordMatch = await compare(dto.password, user.hash);
    if (!passwordMatch) {
      throw new ForbiddenException('Wrong password');
    }

    const tokens = await this.getTokens(user.id, user.email);

    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async logout(userId: string) {
    await this.userRepository.update(
      { hashedRt: null },
      { where: { id: userId } },
    );
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) throw new ForbiddenException('No such user');

    const rtMatches = await compare(refreshToken, user.hashedRt);

    if (!rtMatches) throw new ForbiddenException('Access denied');

    const tokens = await this.getTokens(user.id, user.email);

    await this.updateRtHash(user.id, tokens.refresh_token);

    return tokens;
  }
}
