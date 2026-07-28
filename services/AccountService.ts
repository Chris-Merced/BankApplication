import userRepository from '../repositories/userRepository';
import accountRepository from '../repositories/accountRepository';
import transactionRepository from '../repositories/transactionRepository';
import { Account, AccountType } from '../models/account';
import { Transaction } from '../models/transaction';

function createAccount(userId: number, accountType: AccountType): Account {
  const user = userRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return accountRepository.create(userId, accountType);
}

function getAccount(accountId: number): Account {
  const account = accountRepository.findById(accountId);
  if (!account) {
    throw new Error('Account not found');
  }
  return account;
}

function deposit(accountId: number, amount: number): Account {
  if (amount <= 0) {
    throw new Error('Deposit amount must be positive');
  }
  const account = getAccount(accountId);
  const updatedAccount: Account = { ...account, balance: Number(account.balance) + Number(amount) };
  accountRepository.update(updatedAccount);
  transactionRepository.create(accountId, 'DEPOSIT', amount);
  return updatedAccount;
}

function withdraw(accountId: number, amount: number): Account {
  if (amount <= 0) {
    throw new Error('Withdrawal amount must be positive');
  }
  const account = getAccount(accountId);
  if (account.balance < amount) {
    throw new Error('Insufficient funds');
  }
  const updatedAccount: Account = { ...account, balance: Number(account.balance) - Number(amount) };
  accountRepository.update(updatedAccount);
  transactionRepository.create(accountId, 'WITHDRAWAL', amount);
  return updatedAccount;
}

export interface TransferResult {
  from: Account;
  to: Account;
}

/**
 * Moves funds between two accounts of any type (CHECKING or SAVINGS).
 *
 * Every check runs before either balance is written, so a rejected transfer
 * leaves both accounts untouched rather than debiting without crediting.
 * The movement is recorded as a pair of transactions — TRANSFER_OUT on the
 * source and TRANSFER_IN on the destination — each pointing at the other account.
 */
function transfer(fromAccountId: number, toAccountId: number, amount: number): TransferResult {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Transfer amount must be a positive number');
  }
  if (fromAccountId === toAccountId) {
    throw new Error('Cannot transfer to the same account');
  }
  const from = getAccount(fromAccountId);
  const to = getAccount(toAccountId);
  if (from.balance < amount) {
    throw new Error('Insufficient funds');
  }

  const updatedFrom: Account = { ...from, balance: Number(from.balance) - Number(amount) };
  const updatedTo: Account = { ...to, balance: Number(to.balance) + Number(amount) };
  accountRepository.update(updatedFrom);
  accountRepository.update(updatedTo);
  transactionRepository.create(fromAccountId, 'TRANSFER_OUT', amount, toAccountId);
  transactionRepository.create(toAccountId, 'TRANSFER_IN', amount, fromAccountId);

  return { from: updatedFrom, to: updatedTo };
}

function getTransactions(accountId: number): Transaction[] {
  getAccount(accountId);
  return transactionRepository.findByAccountId(accountId);
}

export default { createAccount, getAccount, deposit, withdraw, transfer, getTransactions };
