import { Body, Controller, Get, HttpCode, UnauthorizedException, Post } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { Public } from '../common/public.decorator';
import { UserDto } from '../users/user.dto';
import { UsersService } from '../users/users.service';
import { AuthResponse, LoginDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.auth.login(dto);
  }

  @Get('me')
  async me(@CurrentUser() me: AuthUser): Promise<UserDto> {
    const user = await this.users.findById(me.id);
    if (!user) throw new UnauthorizedException('Account no longer exists');
    return this.users.toDto(user, true);
  }
}
