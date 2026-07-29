import {
  ClientSession,
  MongoServerError,
  ObjectId,
  WithId,
} from 'mongodb';
import { runInTransaction } from '../db/mongo';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../errors/AppError';
import { Account, AccountType } from '../models/account';
import { Transaction } from '../models/transaction';
import accountRepository from '../repositories/accountRepository';
import transactionRepository from '../repositories/transactionRepository';
import userRepository from '../repositories/userRepository';

function validateAmountCents(amountCents: number): void {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new BadRequestError('amountCents must be a positive integer');
  }
}

function validateIdempotencyKey(idempotencyKey: string): void {
  if (
    typeof idempotencyKey !== 'string' ||
    idempotencyKey.length < 8 ||
    idempotencyKey.length > 128
  ) {
    throw new BadRequestError(
      'Idempotency-Key must be between 8 and 128 characters',
    );
  }
}

function mapIdempotencyConflict(error: unknown): never {
  if (error instanceof MongoServerError && error.code === 11000) {
    throw new ConflictError(
      'A money operation with this Idempotency-Key was already processed',
    );
  }
  throw error;
}

async function requireOwnedAccount(
  accountId: ObjectId,
  userId: ObjectId,
  session?: ClientSession,
  requireActive = false,
): Promise<WithId<Account>> {
  const account = await accountRepository.findById(accountId, session);
  if (!account) {
    throw new NotFoundError('Account not found');
  }
  if (!account.user_id.equals(userId)) {
    throw new ForbiddenError();
  }
  if (requireActive && account.status !== 'ACTIVE') {
    throw new ConflictError('Account is closed');
  }
  return account;
}

async function createAccount(
  userId: ObjectId,
  accountType: AccountType,
): Promise<WithId<Account>> {
  const user = await userRepository.findById(userId);
  if (!user || user.status !== 'ACTIVE') {
    throw new NotFoundError('User not found');
  }
  return accountRepository.create(userId, accountType);
}

async function getAccountsForUser(
  userId: ObjectId,
): Promise<WithId<Account>[]> {
  return accountRepository.findByUserId(userId);
}

async function getAccount(
  accountId: ObjectId,
  userId: ObjectId,
): Promise<WithId<Account>> {
  return requireOwnedAccount(accountId, userId);
}

async function deposit(
  accountId: ObjectId,
  userId: ObjectId,
  amountCents: number,
  idempotencyKey: string,
): Promise<WithId<Account>> {
  validateAmountCents(amountCents);
  validateIdempotencyKey(idempotencyKey);

  try {
    return await runInTransaction(async (session) => {
      await requireOwnedAccount(accountId, userId, session, true);
      const updated = await accountRepository.adjustBalance(
        accountId,
        amountCents,
        session,
      );
      if (!updated) {
        throw new ConflictError('Account is closed');
      }
      await transactionRepository.create(
        accountId,
        'DEPOSIT',
        amountCents,
        null,
        session,
        idempotencyKey,
      );
      return updated;
    });
  } catch (error) {
    return mapIdempotencyConflict(error);
  }
}

async function withdraw(
  accountId: ObjectId,
  userId: ObjectId,
  amountCents: number,
  idempotencyKey: string,
): Promise<WithId<Account>> {
  validateAmountCents(amountCents);
  validateIdempotencyKey(idempotencyKey);

  try {
    return await runInTransaction(async (session) => {
      await requireOwnedAccount(accountId, userId, session, true);
      const updated = await accountRepository.adjustBalance(
        accountId,
        -amountCents,
        session,
      );
      if (!updated) {
        throw new ConflictError('Insufficient funds');
      }
      await transactionRepository.create(
        accountId,
        'WITHDRAWAL',
        amountCents,
        null,
        session,
        idempotencyKey,
      );
      return updated;
    });
  } catch (error) {
    return mapIdempotencyConflict(error);
  }
}

export interface TransferResult {
  from: WithId<Account>;
  to: WithId<Account>;
}

async function transfer(
  fromAccountId: ObjectId,
  userId: ObjectId,
  toAccountId: ObjectId,
  amountCents: number,
  idempotencyKey: string,
): Promise<TransferResult> {
  validateAmountCents(amountCents);
  validateIdempotencyKey(idempotencyKey);
  if (fromAccountId.equals(toAccountId)) {
    throw new BadRequestError('Cannot transfer to the same account');
  }

  try {
    return await runInTransaction(async (session) => {
      await requireOwnedAccount(fromAccountId, userId, session, true);
      const destination = await accountRepository.findById(toAccountId, session);
      if (!destination) {
        throw new NotFoundError('Destination account not found');
      }
      if (destination.status !== 'ACTIVE') {
        throw new ConflictError('Destination account is closed');
      }

      const updatedFrom = await accountRepository.adjustBalance(
        fromAccountId,
        -amountCents,
        session,
      );
      if (!updatedFrom) {
        throw new ConflictError('Insufficient funds');
      }
      const updatedTo = await accountRepository.adjustBalance(
        toAccountId,
        amountCents,
        session,
      );
      if (!updatedTo) {
        throw new ConflictError('Destination account is closed');
      }

      await transactionRepository.create(
        fromAccountId,
        'TRANSFER_OUT',
        amountCents,
        toAccountId,
        session,
        idempotencyKey,
      );
      await transactionRepository.create(
        toAccountId,
        'TRANSFER_IN',
        amountCents,
        fromAccountId,
        session,
      );

      return { from: updatedFrom, to: updatedTo };
    });
  } catch (error) {
    return mapIdempotencyConflict(error);
  }
}

async function getTransactions(
  accountId: ObjectId,
  userId: ObjectId,
): Promise<WithId<Transaction>[]> {
  await requireOwnedAccount(accountId, userId);
  return transactionRepository.findByAccountId(accountId);
}

async function closeAccount(
  accountId: ObjectId,
  userId: ObjectId,
): Promise<void> {
  await runInTransaction(async (session) => {
    const account = await requireOwnedAccount(accountId, userId, session, true);
    if (account.balance_cents !== 0) {
      throw new ConflictError(
        'Cannot close an account with a non-zero balance',
      );
    }
    const closed = await accountRepository.closeById(accountId, session);
    if (!closed) {
      throw new ConflictError('Account could not be closed');
    }
  });
}

export default {
  createAccount,
  getAccountsForUser,
  getAccount,
  deposit,
  withdraw,
  transfer,
  getTransactions,
  closeAccount,
};
