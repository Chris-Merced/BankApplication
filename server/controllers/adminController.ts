import { Request, Response } from 'express';
import { BadRequestError } from '../errors/AppError';
import { toPublicUser, USER_ROLES, UserRole } from '../models/user';
import { toAccountResponse } from '../models/account';
import { toTransactionResponse } from '../models/transaction';
import AccountService from '../services/AccountService';
import UserService from '../services/UserService';
import { sendError } from './httpError';
import { parseObjectId } from './requestValidation';

function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' &&
    (USER_ROLES as readonly string[]).includes(value)
  );
}

async function listUsers(_req: Request, res: Response): Promise<void> {
  try {
    const users = await UserService.listUsers();
    res.json(users.map(toPublicUser));
  } catch (error) {
    sendError(res, error);
  }
}

async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = parseObjectId(req.params.id, 'user ID');
    const user = await UserService.getUserById(userId);
    res.json(toPublicUser(user));
  } catch (error) {
    sendError(res, error);
  }
}

async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = parseObjectId(req.params.id, 'user ID');
    const { name, email } = req.body;
    if (name === undefined && email === undefined) {
      throw new BadRequestError('name and/or email must be provided');
    }
    if (
      (name !== undefined && typeof name !== 'string') ||
      (email !== undefined && typeof email !== 'string')
    ) {
      throw new BadRequestError('name and email must be strings');
    }

    const user = await UserService.updateUser(userId, { name, email });
    res.json(toPublicUser(user));
  } catch (error) {
    sendError(res, error);
  }
}

async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = parseObjectId(req.params.id, 'user ID');
    await UserService.deleteUser(userId);
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
}

async function setUserRole(req: Request, res: Response): Promise<void> {
  try {
    const userId = parseObjectId(req.params.id, 'user ID');
    if (!isUserRole(req.body.role)) {
      throw new BadRequestError(
        `role must be one of: ${USER_ROLES.join(', ')}`,
      );
    }

    const user = await UserService.setUserRole(
      req.auth!.userId,
      userId,
      req.body.role,
    );
    res.json(toPublicUser(user));
  } catch (error) {
    sendError(res, error);
  }
}

async function listAccounts(_req: Request, res: Response): Promise<void> {
  try {
    const accounts = await AccountService.listAllAccounts();
    res.json(accounts.map(toAccountResponse));
  } catch (error) {
    sendError(res, error);
  }
}

async function getAccount(req: Request, res: Response): Promise<void> {
  try {
    const accountId = parseObjectId(req.params.id, 'account ID');
    const account = await AccountService.getAccountAsAdmin(accountId);
    res.json(toAccountResponse(account));
  } catch (error) {
    sendError(res, error);
  }
}

async function getAccountTransactions(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const accountId = parseObjectId(req.params.id, 'account ID');
    const transactions = await AccountService.getTransactionsAsAdmin(
      accountId,
    );
    res.json(transactions.map(toTransactionResponse));
  } catch (error) {
    sendError(res, error);
  }
}

export default {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  setUserRole,
  listAccounts,
  getAccount,
  getAccountTransactions,
};
