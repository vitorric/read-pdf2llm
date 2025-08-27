import {
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
  ExceptionFilter,
  BadRequestException,
  ValidationError,
} from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';

import { Logger } from '@infra/logger/logger.service';
import { AppError } from '@shared/base-classes/app-error';

type AppExceptionLog = {
  statusCode: number;
  name: string;
  message: string;
  stack?: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: any, host: ArgumentsHost): any {
    const hostType = host.getType();

    if (hostType === 'rpc') {
      if (exception instanceof BadRequestException) {
        const rpcException: AppExceptionLog = {
          statusCode: 400,
          message: exception.message,
          stack: exception?.stack,
          name: exception.name,
        };

        return this.logger.warn(rpcException);
      }
      throw new RpcException(exception?.message);
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const statusCode = this.getStatusCode(exception);

    const customException: AppExceptionLog = {
      statusCode,
      message: this.getMessage(exception),
      stack: exception?.stack,
      name: this.getName(exception, statusCode),
    };

    this.logException(exception, customException);

    response.status(customException.statusCode).json({
      name: customException.name,
      message: customException.message,
    });
  }

  private getStatusCode(exception: any): number {
    if (exception instanceof AppError) {
      return exception.statusCode;
    }

    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(exception: any): string {
    if (exception instanceof AppError) {
      return exception.message;
    }

    if (exception instanceof HttpException) {
      const message = (exception as any)?.response?.message;

      if (Array.isArray(message) && exception instanceof BadRequestException) {
        return this.getValidationPipeErrorMessage(message);
      }

      return message;
    }

    return 'Internal server error';
  }

  private getValidationPipeErrorMessage(validationErrors: ValidationError[]) {
    const validationError = validationErrors[0];

    const validationChildren = validationError?.children;
    const hasNestedErrors =
      Array.isArray(validationChildren) && validationChildren.length > 0;

    if (!hasNestedErrors) {
      return Object.values(validationError?.constraints ?? {})[0];
    }

    return this.getValidationPipeErrorMessage(validationChildren);
  }

  private getName(exception: any, statusCode: number): string {
    if (exception instanceof AppError) {
      return exception.name;
    }

    const name =
      Object.keys(HttpStatus)[Object.values(HttpStatus).indexOf(statusCode)];

    return `SA_EXCEPTION_FILTER_${name}`;
  }

  private logException(exception: any, customException: AppExceptionLog): void {
    if (
      exception instanceof AppError ||
      exception instanceof BadRequestException
    ) {
      return this.logger.warn(customException);
    }

    return this.logger.error(customException);
  }
}

@Catch()
export class RpcExceptionFilterMicroservice extends BaseRpcExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    return super.catch(exception, host);
  }
}
