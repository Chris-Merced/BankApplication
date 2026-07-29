import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import userRepository from '../repositories/userRepository';
import { verifyToken } from '../services/AuthService';
import { sendError } from '../controllers/httpError';

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorization = req.header('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedError();
    }

    const token = authorization.slice('Bearer '.length).trim();
    const userId = verifyToken(token);
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User account no longer exists');
    }

    req.auth = { userId };
    next();
  } catch (error) {
    sendError(res, error);
  }
}
