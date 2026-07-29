import { Request, Response } from 'express';
import UserService from '../services/UserService';
import { toPublicUser } from '../models/user';

/**
 * Creates a new user.
 *
 * `POST /api/users`
 *
 * @param req - Express request with `name`, `email`, and `password` in the JSON body.
 * @param res - Returns the created user with status 201, or an error with status 400.
 */
async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'name, email, and password are required' });
      return;
    }
    const user = await UserService.createUser(name, email, password);
    res.status(201).json(toPublicUser(user));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

/**
 * Authenticates a user with their email and password.
 *
 * `POST /api/users/login`
 *
 * @param req - Express request with `email` and `password` in the JSON body.
 * @param res - Returns the authenticated user (never the password hash) with
 *              status 200, or an error with status 401.
 */
async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }
    const user = await UserService.login(email, password);
    res.json(toPublicUser(user));
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
  }
}

/**
 * Retrieves a user by their ID.
 *
 * `GET /api/users/:id`
 *
 * @param req - Express request with the user ID in `params.id`.
 * @param res - Returns the user with status 200, or an error with status 404.
 */
async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);
    const user = await UserService.getUserById(userId);
    res.json(toPublicUser(user));
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}

/**
 * Retrieves all users.
 *
 * `GET /api/users`
 *
 * @param req - Express request.
 * @param res - Returns the list of users with status 200.
 */
async function getUsers(req: Request, res: Response): Promise<void> {
  const users = await UserService.getAllUsers();
  res.json(users.map(toPublicUser));
}

/**
 * Updates a user's name and/or email.
 *
 * `PATCH /api/users/:id`
 *
 * @param req - Express request with the user ID in `params.id` and optional `name`/`email` in the JSON body.
 * @param res - Returns the updated user with status 200, or an error with status 400.
 */
async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);
    const { name, email } = req.body;
    if (name === undefined && email === undefined) {
      res.status(400).json({ error: 'name and/or email must be provided' });
      return;
    }
    const user = await UserService.updateUser(userId, { name, email });
    res.json(toPublicUser(user));
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

/**
 * Deletes a user, cascading to their accounts and transaction history.
 *
 * `DELETE /api/users/:id`
 *
 * @param req - Express request with the user ID in `params.id`.
 * @param res - Returns status 204 on success, or an error with status 400.
 */
async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = Number(req.params.id);
    await UserService.deleteUser(userId);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export default { createUser, login, getUser, getUsers, updateUser, deleteUser };
