import { Request, Response } from 'express';
import AccountService from '../services/AccountService';
import { AccountType } from '../models/account';

/**
 * Creates an account for an existing user.
 *
 * `POST /api/accounts`
 *
 * @param req - Express request with `userId` and `accountType` in the JSON body (validated by {@link createAccountSchema}).
 * @param res - Returns the created account with status 201, or an error with status 400.
 */
async function createAccount(req: Request, res: Response): Promise<void> {
  try {
    const { userId, accountType } = req.body as { userId: number; accountType: AccountType };
    const account = await AccountService.createAccount(userId, accountType);
    res.status(201).json(account);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

/**
 * Lists the accounts belonging to a user.
 *
 * `GET /api/accounts?userId=1`
 *
 * @param req - Express request with `userId` in the query string (validated by {@link listAccountsQuerySchema}).
 * @param res - Returns the account list with status 200, or an error with status 400.
 */
async function listAccounts(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.query as unknown as { userId: number };
    const accounts = await AccountService.getAccountsByUser(userId);
    res.json(accounts);
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
async function getAccount(req: Request, res: Response): Promise<void> {
  try {
    const accountId = Number(req.params.id);
    const account = await AccountService.getAccount(accountId);
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
 * @param req - Express request with the account ID in `params.id` and `amount_cents` in the JSON body (validated by {@link amountSchema}).
 * @param res - Returns the updated account with status 200, or an error with status 400.
 */
async function deposit(req: Request, res: Response): Promise<void> {
  try {
    const accountId = Number(req.params.id);
    const { amount_cents } = req.body as { amount_cents: number };
    const account = await AccountService.deposit(accountId, amount_cents);
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
 * @param req - Express request with the account ID in `params.id` and `amount_cents` in the JSON body (validated by {@link amountSchema}).
 * @param res - Returns the updated account with status 200, or an error with status 400.
 */
async function withdraw(req: Request, res: Response): Promise<void> {
  try {
    const accountId = Number(req.params.id);
    const { amount_cents } = req.body as { amount_cents: number };
    const account = await AccountService.withdraw(accountId, amount_cents);
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

/**
 * Transfers funds from one account to another, including an account owned by a
 * different user.
 *
 * `POST /api/accounts/:id/transfer`
 *
 * @param req - Express request with the source account ID in `params.id`, and
 *              `toAccountId` and `amount_cents` in the JSON body (validated by {@link transferSchema}).
 * @param res - Returns the updated source account plus the recipient's account ID
 *              and owner name with status 200, or an error with status 400. The
 *              destination balance is never returned — it may belong to another user.
 */
async function transfer(req: Request, res: Response): Promise<void> {
  try {
    const fromAccountId = Number(req.params.id);
    const { toAccountId, amount_cents } = req.body as { toAccountId: number; amount_cents: number };
    const result = await AccountService.transfer(fromAccountId, toAccountId, amount_cents);
    res.json(result);
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
async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const accountId = Number(req.params.id);
    const transactions = await AccountService.getTransactions(accountId);
    res.json(transactions);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}

/**
 * Deletes an account. The balance must be zero first.
 *
 * `DELETE /api/accounts/:id`
 *
 * @param req - Express request with the account ID in `params.id`.
 * @param res - Returns status 204 on success, or an error with status 400.
 */
async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    const accountId = Number(req.params.id);
    await AccountService.deleteAccount(accountId);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

/**
 * Deletes a single transaction from an account's history.
 *
 * `DELETE /api/accounts/:id/transactions/:txnId`
 *
 * @param req - Express request with the account ID in `params.id` and the transaction ID in `params.txnId`.
 * @param res - Returns status 204 on success, or an error with status 400.
 */
async function deleteTransaction(req: Request, res: Response): Promise<void> {
  try {
    const accountId = Number(req.params.id);
    const txnId = Number(req.params.txnId);
    await AccountService.deleteTransaction(accountId, txnId);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export default {
  createAccount,
  listAccounts,
  getAccount,
  deposit,
  withdraw,
  transfer,
  getTransactions,
  deleteAccount,
  deleteTransaction,
};
