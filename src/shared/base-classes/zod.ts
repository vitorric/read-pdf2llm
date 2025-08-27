import { ZodType } from 'zod';
import { AppError, AppErrorStatusCode } from './app-error';

const errorPath = (path?: Array<string | number>): string => {
  return Array.isArray(path) && path.length > 0
    ? path
        .filter((p) => isNaN(Number(p)))
        .map(String)
        .join('.')
    : 'unknown';
};

export const ValidateSchema = <B, T>(schema: ZodType, data: B): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const firstIssue = result.error.issues[0];

    const field = firstIssue?.path
      ? errorPath(
          firstIssue.path.filter(
            (key): key is string | number =>
              typeof key === 'string' || typeof key === 'number',
          ),
        )
      : 'Unkown Field';

    const message = firstIssue?.message ?? 'Validation Error';

    throw new AppError(
      'ZOD_VALIDATION',
      `${field}: ${message}`,
      AppErrorStatusCode.BAD_REQUEST,
    );
  }

  return result.data as T;
};
