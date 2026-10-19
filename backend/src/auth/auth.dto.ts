import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UserDto } from '../users/user.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegisterDto {
  @Transform(trim)
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(254)
  email: string;

  @Transform(trim)
  @IsString()
  @Matches(/^[A-Za-z0-9_]{3,20}$/, { message: 'Use 3–20 letters, digits or underscores' })
  username: string;

  @IsString()
  @MinLength(8, { message: 'Use at least 8 characters' })
  @MaxLength(72)
  password: string;
}

export class LoginDto {
  @Transform(trim)
  @IsEmail({}, { message: 'Enter a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Enter your password' })
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserDto;
}

export interface JwtPayload {
  sub: string;
  username: string;
}
