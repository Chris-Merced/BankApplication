import { Request, Response } from 'express';
import { toPublicUser } from '../models/user';
import UserService from '../services/UserService';
import { sendError } from './httpError';

async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    const user = await UserService.getUserById(req.auth!.userId);
    res.json(toPublicUser(user));
  } catch (error) {
    sendError(res, error);
  }
}

async function updateCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    const { name, email } = req.body as { name?: string; email?: string };
    const user = await UserService.updateUser(req.auth!.userId, {
      name,
      email,
    });
    res.json(toPublicUser(user));
  } catch (error) {
    sendError(res, error);
  }
}

async function deleteCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    await UserService.deleteUser(req.auth!.userId);
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
}

export default { getCurrentUser, updateCurrentUser, deleteCurrentUser };
