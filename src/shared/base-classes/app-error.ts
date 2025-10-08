export enum AppErrorStatusCode {
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
}

export class AppError extends Error {
  readonly name: string;
  readonly statusCode: AppErrorStatusCode;

  constructor(
    name: string,
    message: string,
    statusCode = AppErrorStatusCode.BAD_REQUEST,
  ) {
    super(message);

    this.name = name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
