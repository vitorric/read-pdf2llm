import { Logger as LoggerPino } from 'nestjs-pino';

import { Injectable } from '@nestjs/common';

export const LOGER_INJECTION_TOKEN = 'LOGER_INJECTION_TOKEN';

@Injectable()
export class Logger {
  constructor(private readonly logger: LoggerPino) {}

  log(log: string | object, details?: object): void {
    this.logger.log(this.getLogObject(log, details));
  }

  warn(log: string | object, details?: object): void {
    this.logger.warn(this.getLogObject(log, details));
  }

  error(log: string | object, details?: object): void {
    this.logger.error(this.getLogObject(log, details));
  }

  fatal(log: string | object, details?: object): void {
    this.logger.fatal(this.getLogObject(log, details));
  }

  debug(log: string | object, details?: object): void {
    this.logger.debug(this.getLogObject(log, details));
  }

  private getLogObject(log: string | object, content?: string | object) {
    const isError = content instanceof Error;
    const contentIsObject = typeof content === 'object';
    const logIsObject = typeof log === 'object';
    const logIsObjectError = typeof log === 'object' && log instanceof Error;
    const details = contentIsObject ? { ...content } : content;
    const logObject = {
      ...(log && !logIsObject && { msg: log }),
      ...((content &&
        !isError &&
        logIsObject &&
        !logIsObjectError && {
          details: {
            context: details,
            ...log,
          },
        }) ||
        (!content &&
          logIsObject &&
          !logIsObjectError && {
            details: {
              ...log,
            },
          }) ||
        (!content &&
          logIsObjectError && {
            details: {
              error: log.message,
            },
            err: log,
          }) ||
        (content &&
          !isError && {
            details: {
              context: details,
            },
          }) ||
        (content &&
          isError && {
            details: {
              error: content?.message,
            },
            err: content,
          })),
    };

    return logObject;
  }
}
