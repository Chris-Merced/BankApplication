import { Request, Response } from 'express';
import { BadRequestError } from '../errors/AppError';
import {
  ACCOUNT_TYPES,
  AccountType,
  toAccountResponse,
} from '../models/account';
import { toTransactionResponse } from '../models/transaction';
import AccountService from '../services/AccountService';
import { sendError } from './httpError';
import {
  parseObjectId,
  requireIdempotencyKey,
} from './requestValidation';

function isAccountType(value: unknown): value is AccountType {
  return (
    typeof value === 'string' &&
    (ACCOUNT_TYPES as readonly string[]).includes(value)
  );
}

async function createAccount(req: Request, res: Response): Promise<void> {
  try {
    const normalizedType =
      typeof req.body.accountType === 'string'
        ? req.body.accountType.toUpperCase()
        : req.body.accountType;
    if (!isAccountType(normalizedType)) {
      throw new BadRequestError(
        `accountType must be one of: ${ACCOUNT_TYPES.join(', ')}`,
      );
    }

    const account = await AccountService.createAccount(
      req.auth!.userId,
      normalizedType,
    );
    res.status(201).json(toAccountResponse(account));
  } catch (error) {
    sendError(res, error);
  }
}

async function listAccounts(req: Request, res: Response): Promise<void> {
  try {
    const accounts = await AccountService.getAccountsForUser(req.auth!.userId);
    res.json(accounts.map(toAccountResponse));
  } catch (error) {
    sendError(res, error);
  }
}

async function getAccount(req: Request, res: Response): Promise<void> {
  try {
    const accountId = parseObjectId(req.params.id, 'account ID');
    const account = await AccountService.getAccount(
      accountId,
      req.auth!.userId,
    );
    res.json(toAccountResponse(account));
  } catch (error) {
    sendError(res, error);
  }
}

async function deposit(req: Request, res: Response): Promise<void> {
  try {
    const accountId = parseObjectId(req.params.id, 'account ID');
    const account = await AccountService.deposit(
      accountId,
      req.auth!.userId,
      req.body.amountCents,
      requireIdempotencyKey(req.header('Idempotency-Key')),
    );
    res.json(toAccountResponse(account));
  } catch (error) {
    sendError(res, error);
  }
}

async function withdraw(req: Request, res: Response): Promise<void> {
  try {
    const accountId = parseObjectId(req.params.id, 'account ID');
    const account = await AccountService.withdraw(
      accountId,
      req.auth!.userId,
      req.body.amountCents,
      requireIdempotencyKey(req.header('Idempotency-Key')),
    );
    res.json(toAccountResponse(account));
  } catch (error) {
    sendError(res, error);
  }
}

async function transfer(req: Request, res: Response): Promise<void> {
  try {
    const fromAccountId = parseObjectId(req.params.id, 'account ID');
    const toAccountId = parseObjectId(
      String(req.body.toAccountId),
      'destination account ID',
    );
    const result = await AccountService.transfer(
      fromAccountId,
      req.auth!.userId,
      toAccountId,
      req.body.amountCents,
      requireIdempotencyKey(req.header('Idempotency-Key')),
    );
    res.json({
      from: toAccountResponse(result.from),
      to: toAccountResponse(result.to),
    });
  } catch (error) {
    sendError(res, error);
  }
}

async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const accountId = parseObjectId(req.params.id, 'account ID');
    const transactions = await AccountService.getTransactions(
      accountId,
      req.auth!.userId,
    );
    res.json(transactions.map(toTransactionResponse));
  } catch (error) {
    sendError(res, error);
  }
}

async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    const accountId = parseObjectId(req.params.id, 'account ID');
    await AccountService.deleteAccount(accountId, req.auth!.userId);
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
}

async function deleteTransaction(req: Request, res: Response): Promise<void> {
  try {
    const accountId = parseObjectId(req.params.id, 'account ID');
    const transactionId = parseObjectId(
      req.params.txnId,
      'transaction ID',
    );
    await AccountService.deleteTransaction(
      accountId,
      req.auth!.userId,
      transactionId,
    );
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
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
