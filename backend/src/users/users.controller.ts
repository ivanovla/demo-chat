import { Controller, Get, Query } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { ListUsersQuery, UserDto } from './user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async list(@CurrentUser() me: AuthUser, @Query() query: ListUsersQuery): Promise<UserDto[]> {
    const users = await this.users.search(me.id, query.search, query.limit);
    return users.map((u) => this.users.toDto(u));
  }
}
