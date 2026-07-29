import { BadRequestError } from '../errors/AppError';

export function parsePositiveId(
  value: string | string[],
  name: string,
): number {
  if (Array.isArray(value)) {
    throw new BadRequestError(`${name} must be a positive integer`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new BadRequestError(`${name} must be a positive integer`);
  }
  return parsed;
}

export function requireIdempotencyKey(
  value: string | undefined,
): string {
  if (!value) {
    throw new BadRequestError('Idempotency-Key header is required');
  }
  return value.trim();
}
