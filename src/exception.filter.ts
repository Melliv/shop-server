import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const error = exception.message.toLowerCase();

    const words = error.split(' ');
    if (words[0] === 'cannot') {
      response.status(status).json({
        errors: { detail: 'Not Found' },
      });
    } else {
      response.status(status).json(error[0].toUpperCase() + error.substring(1));
    }
  }
}
