import { Request, Response } from 'express';
import AccountService from '../services/AccountService';
import { AccountType, ACCOUNT_TYPES } from '../models/account';

function isAccountType(value: unknown): value is AccountType {
  return typeof value === 'string' && (ACCOUNT_TYPES as string[]).includes(value);
}

/**
 * Creates an account for an existing user.
 *
 * `POST /api/accounts`
 *
 * @param req - Express request with `userId` and `accountType` in the JSON body.
 * @param res - Returns the created account with status 201, or an error with status 400.
 */
function createAccount(req: Request, res: Response): void {
  try {
    const { userId, accountType } = req.body;
    if (!userId || !accountType) {
      res.status(400).json({ error: 'userId and accountType are required' });
      return;
    }
    const normalizedType = typeof accountType === 'string' ? accountType.toUpperCase() : accountType;
    if (!isAccountType(normalizedType)) {
      res.status(400).json({ error: `accountType must be one of: ${ACCOUNT_TYPES.join(', ')}` });
      return;
    }
    const account = AccountService.createAccount(Number(userId), normalizedType);
    res.status(201).json(account);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

/**
 * Retrieves an account by its ID.
 *
 * `GET /api/accounts/:id`
 *
 * @param req - Express request with the account ID in `params.id`.
 * @param res - Returns the account with status 200, or an error with status 404.
 */
function getAccount(req: Request, res: Response): void {
  try {
    const accountId = Number(req.params.id);
    const account = AccountService.getAccount(accountId);
    res.json(account);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}

/**
 * Deposits funds into an account.
 *
 * `POST /api/accounts/:id/deposit`
 *
 * @param req - Express request with the account ID in `params.id` and `amount` in the JSON body.
 * @param res - Returns the updated account with status 200, or an error with status 400.
 */
function deposit(req: Request, res: Response): void {
  try {
    const accountId = Number(req.params.id);
    const { amount } = req.body;
    const account = AccountService.deposit(accountId, Number(amount));
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

/**
 * Withdraws funds from an account.
 *
 * `POST /api/accounts/:id/withdraw`
 *
 * @param req - Express request with the account ID in `params.id` and `amount` in the JSON body.
 * @param res - Returns the updated account with status 200, or an error with status 400.
 */
function withdraw(req: Request, res: Response): void {
  try {
    const accountId = Number(req.params.id);
    const { amount } = req.body;
    const account = AccountService.withdraw(accountId, Number(amount));
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

/**
 * Retrieves the transaction history for an account.
 *
 * `GET /api/accounts/:id/transactions`
 *
 * @param req - Express request with the account ID in `params.id`.
 * @param res - Returns the transaction list with status 200, or an error with status 404.
 */
function getTransactions(req: Request, res: Response): void {
  try {
    const accountId = Number(req.params.id);
    const transactions = AccountService.getTransactions(accountId);
    res.json(transactions);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}

export default { createAccount, getAccount, deposit, withdraw, getTransactions };
