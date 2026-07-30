import { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../errors/AppError';
import { sendError } from '../controllers/httpError';

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    if (req.auth?.role !== 'admin') {
      throw new ForbiddenError('Admin access required');
    }
    next();
  } catch (error) {
    sendError(res, error);
  }
}
