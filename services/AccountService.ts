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

async function deposit(accountId: number, amount: number): Promise<Account> {
  if (amount <= 0) {
    throw new Error('Deposit amount must be positive');
  }
  const account = await getAccount(accountId);
  const updatedAccount: Account = { ...account, balance: Number(account.balance) + Number(amount) };
  await accountRepository.update(updatedAccount);
  await transactionRepository.create(accountId, 'DEPOSIT', amount);
  return updatedAccount;
}

async function withdraw(accountId: number, amount: number): Promise<Account> {
  if (amount <= 0) {
    throw new Error('Withdrawal amount must be positive');
  }
  const account = await getAccount(accountId);
  if (account.balance < amount) {
    throw new Error('Insufficient funds');
  }
  const updatedAccount: Account = { ...account, balance: Number(account.balance) - Number(amount) };
  await accountRepository.update(updatedAccount);
  await transactionRepository.create(accountId, 'WITHDRAWAL', amount);
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
async function transfer(fromAccountId: number, toAccountId: number, amount: number): Promise<TransferResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Transfer amount must be a positive number');
  }
  if (fromAccountId === toAccountId) {
    throw new Error('Cannot transfer to the same account');
  }
  const from = await getAccount(fromAccountId);
  const to = await getAccount(toAccountId);
  if (from.balance < amount) {
    throw new Error('Insufficient funds');
  }

  const updatedFrom: Account = { ...from, balance: Number(from.balance) - Number(amount) };
  const updatedTo: Account = { ...to, balance: Number(to.balance) + Number(amount) };
  await accountRepository.update(updatedFrom);
  await accountRepository.update(updatedTo);
  await transactionRepository.create(fromAccountId, 'TRANSFER_OUT', amount, toAccountId);
  await transactionRepository.create(toAccountId, 'TRANSFER_IN', amount, fromAccountId);

  return { from: updatedFrom, to: updatedTo };
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
  if (account.balance !== 0) {
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
  deposit,
  withdraw,
  transfer,
  getTransactions,
  deleteAccount,
  deleteTransaction,
};
