import { BadRequestException, HttpException } from '@nestjs/common';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

export async function validateDto<T extends object>(
  cls: ClassConstructor<T>,
  payload: unknown,
): Promise<T> {
  const instance = plainToInstance(cls, payload ?? {});
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
  if (errors.length) {
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new BadRequestException(messages);
  }
  return instance;
}

export function errorMessage(err: unknown): string {
  if (err instanceof HttpException) {
    const body = err.getResponse();
    const message =
      typeof body === 'string' ? body : (body as { message?: string | string[] }).message;
    return Array.isArray(message) ? message.join(', ') : (message ?? err.message);
  }
  return 'Something went wrong';
}
