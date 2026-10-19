import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { rm } from 'fs/promises';

interface ErrorBody {
  statusCode: number;
  message: unknown;
  error: string;
}

const clientStatusOf = (err: unknown): number | undefined => {
  const status = (err as { status?: unknown } | null)?.status;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') return;
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { file?: Express.Multer.File }>();
    const res = ctx.getResponse<Response>();
    const [status, body] = this.describe(exception);

    const cleanup = req.file?.path
      ? rm(req.file.path, { force: true }).catch(() => undefined)
      : Promise.resolve();
    void cleanup.then(() => res.status(status).json(body));
  }

  private describe(exception: unknown): [number, ErrorBody | object] {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      return [
        status,
        typeof body === 'string'
          ? { statusCode: status, message: body, error: exception.name }
          : body,
      ];
    }

    const status = clientStatusOf(exception);
    if (status === 404) return [404, { statusCode: 404, message: 'Not found', error: 'Not Found' }];
    if (status)
      return [status, { statusCode: status, message: 'Request rejected', error: 'Bad Request' }];

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    return [
      500,
      { statusCode: 500, message: 'Internal server error', error: 'Internal Server Error' },
    ];
  }
}
