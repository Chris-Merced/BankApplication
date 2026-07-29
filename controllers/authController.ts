import { Request, Response } from 'express';
import { BadRequestError } from '../errors/AppError';
import AuthService from '../services/AuthService';
import { sendError } from './httpError';

async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      throw new BadRequestError('name, email, and password are required');
    }
    const result = await AuthService.register(name, email, password);
    res.status(201).json(result);
  } catch (error) {
    sendError(res, error);
  }
}

async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new BadRequestError('email and password are required');
    }
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (error) {
    sendError(res, error);
  }
}

export default { register, login };
