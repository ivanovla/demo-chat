import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') return;
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const payload =
        typeof body === 'string'
          ? { statusCode: status, message: body, error: exception.name }
          : body;
      res.status(status).json(payload);
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    res
      .status(500)
      .json({ statusCode: 500, message: 'Internal server error', error: 'Internal Server Error' });
  }
}
