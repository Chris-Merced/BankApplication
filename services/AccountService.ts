import userRepository from '../repositories/userRepository';
import accountRepository from '../repositories/accountRepository';
import transactionRepository from '../repositories/transactionRepository';
import { Account } from '../models/account';
import { Transaction } from '../models/transaction';

function createAccount(userId: number, accountType: string): Account {
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
  account.balance = Number(account.balance) + Number(amount);
  transactionRepository.create(accountId, 'DEPOSIT', amount);
  return account;
}

function withdraw(accountId: number, amount: number): Account {
  if (amount <= 0) {
    throw new Error('Withdrawal amount must be positive');
  }
  const account = getAccount(accountId);
  if (account.balance < amount) {
    throw new Error('Insufficient funds');
  }
  account.balance = Number(account.balance) - Number(amount);
  transactionRepository.create(accountId, 'WITHDRAWAL', amount);
  return account;
}

function getTransactions(accountId: number): Transaction[] {
  getAccount(accountId);
  return transactionRepository.findByAccountId(accountId);
}

export default { createAccount, getAccount, deposit, withdraw, getTransactions };
