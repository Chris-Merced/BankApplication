import { ObjectId } from 'mongodb';
import { BadRequestError } from '../errors/AppError';

export function parseObjectId(
  value: string | string[],
  name: string,
): ObjectId {
  if (Array.isArray(value) || !ObjectId.isValid(value)) {
    throw new BadRequestError(`${name} must be a valid MongoDB ObjectId`);
  }
  return new ObjectId(value);
}

export function requireIdempotencyKey(
  value: string | undefined,
): string {
  if (!value) {
    throw new BadRequestError('Idempotency-Key header is required');
  }
  return value.trim();
}
