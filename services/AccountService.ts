import userRepository from '../repositories/userRepository';
import accountRepository from '../repositories/accountRepository';
import transactionRepository from '../repositories/transactionRepository';
import { Account, AccountType } from '../models/account';
import { Transaction } from '../models/transaction';

async function createAccount(userId: number, accountType: AccountType): Promise<Account> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return accountRepository.create(userId, accountType);
}

async function getAccount(accountId: number): Promise<Account> {
  const account = await accountRepository.findById(accountId);
  if (!account) {
    throw new Error('Account not found');
  }
  return account;
}

/** Lists every account belonging to a user, so a signed-in user can see their own. */
async function getAccountsByUser(userId: number): Promise<Account[]> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return accountRepository.findByUserId(userId);
}

async function deposit(accountId: number, amountCents: number): Promise<Account> {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error('Deposit amount_cents must be a positive integer');
  }
  const account = await getAccount(accountId);
  const updatedAccount: Account = { ...account, balance_cents: account.balance_cents + amountCents };
  await accountRepository.update(updatedAccount);
  await transactionRepository.create(accountId, 'DEPOSIT', amountCents);
  return updatedAccount;
}

async function withdraw(accountId: number, amountCents: number): Promise<Account> {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error('Withdrawal amount_cents must be a positive integer');
  }
  const account = await getAccount(accountId);
  if (account.balance_cents < amountCents) {
    throw new Error('Insufficient funds');
  }
  const updatedAccount: Account = { ...account, balance_cents: account.balance_cents - amountCents };
  await accountRepository.update(updatedAccount);
  await transactionRepository.create(accountId, 'WITHDRAWAL', amountCents);
  return updatedAccount;
}

export interface TransferRecipient {
  account_id: number;
  owner_name: string;
}

export interface TransferResult {
  from: Account;
  to: TransferRecipient;
  amount_cents: number;
}

/**
 * Moves funds between two accounts of any type (CHECKING or SAVINGS). The
 * destination may belong to a different user — the account ID alone identifies
 * it, and no relationship between the two owners is required.
 *
 * Every check runs before either balance is written, so a rejected transfer
 * leaves both accounts untouched rather than debiting without crediting.
 * The movement is recorded as a pair of transactions — TRANSFER_OUT on the
 * source and TRANSFER_IN on the destination — each pointing at the other account.
 */
async function transfer(fromAccountId: number, toAccountId: number, amountCents: number): Promise<TransferResult> {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error('Transfer amount_cents must be a positive integer');
  }
  if (fromAccountId === toAccountId) {
    throw new Error('Cannot transfer to the same account');
  }
  const from = await getAccount(fromAccountId);
  const to = await getAccount(toAccountId);
  if (from.balance_cents < amountCents) {
    throw new Error('Insufficient funds');
  }

  const recipient = await userRepository.findById(to.user_id);
  if (!recipient) {
    throw new Error('Destination account has no owner');
  }

  const updatedFrom: Account = { ...from, balance_cents: from.balance_cents - amountCents };
  const updatedTo: Account = { ...to, balance_cents: to.balance_cents + amountCents };

  await accountRepository.update(updatedFrom);
  try {
    await accountRepository.update(updatedTo);
  } catch (err) {
    // The debit succeeded but the credit did not, so the money currently exists
    // nowhere. Put it back. Without a multi-document transaction this
    // compensating write is the strongest guarantee available.
    await accountRepository.update(from);
    throw new Error('Transfer failed and was rolled back; no funds were moved');
  }

  await transactionRepository.create(fromAccountId, 'TRANSFER_OUT', amountCents, toAccountId);
  await transactionRepository.create(toAccountId, 'TRANSFER_IN', amountCents, fromAccountId);

  return {
    from: updatedFrom,
    to: { account_id: to.account_id, owner_name: recipient.name },
    amount_cents: amountCents,
  };
}

async function getTransactions(accountId: number): Promise<Transaction[]> {
  await getAccount(accountId);
  return transactionRepository.findByAccountId(accountId);
}

/**
 * Deletes an account. The balance must be zero first, mirroring how a real
 * bank requires an account to be emptied before it can be closed.
 */
async function deleteAccount(accountId: number): Promise<void> {
  const account = await getAccount(accountId);
  if (account.balance_cents !== 0) {
    throw new Error('Cannot delete an account with a non-zero balance');
  }
  await transactionRepository.deleteByAccountId(accountId);
  await accountRepository.deleteById(accountId);
}

async function deleteTransaction(accountId: number, txnId: number): Promise<void> {
  await getAccount(accountId);
  const txn = await transactionRepository.findById(txnId);
  if (!txn || txn.account_id !== accountId) {
    throw new Error('Transaction not found');
  }
  await transactionRepository.deleteById(txnId);
}

export default {
  createAccount,
  getAccount,
  getAccountsByUser,
  deposit,
  withdraw,
  transfer,
  getTransactions,
  deleteAccount,
  deleteTransaction,
};
