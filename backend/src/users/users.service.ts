import { ConflictException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { isDuplicateKeyError } from '../common/errors';
import { PresenceService } from '../realtime/presence.service';
import { UserDto } from './user.dto';
import { User, UserDocument } from './user.schema';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly presence: PresenceService,
  ) {}

  async onModuleInit() {
    await this.users.init();
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<UserDocument> {
    try {
      return await this.users.create({ ...data, usernameLower: data.username.toLowerCase() });
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        const field = err.keyPattern?.email ? 'email' : 'username';
        throw new ConflictException({
          statusCode: 409,
          message: field === 'email' ? 'Email is already registered' : 'Username is already taken',
          error: 'Conflict',
          field,
        });
      }
      throw err;
    }
  }

  findByEmailWithPassword(email: string) {
    return this.users.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash').exec();
  }

  findById(id: string | Types.ObjectId) {
    return this.users.findById(id).exec();
  }

  findByIds(ids: (string | Types.ObjectId)[]) {
    return this.users.find({ _id: { $in: ids } }).exec();
  }

  search(excludeId: string, search: string | undefined, limit: number) {
    const filter: Record<string, unknown> = { _id: { $ne: new Types.ObjectId(excludeId) } };
    const term = search?.trim().toLowerCase();
    if (term) filter.usernameLower = { $regex: escapeRegex(term) };
    return this.users.find(filter).sort({ usernameLower: 1 }).limit(limit).exec();
  }

  toDto(user: UserDocument, includeEmail = false): UserDto {
    const dto: UserDto = {
      id: user.id,
      username: user.username,
      online: this.presence.isOnline(user.id),
    };
    if (includeEmail) dto.email = user.email;
    return dto;
  }
}
