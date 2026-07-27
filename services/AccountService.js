const userRepository = require('../repositories/userRepository');
const accountRepository = require('../repositories/accountRepository');
const transactionRepository = require('../repositories/transactionRepository');

function createAccount(userId, accountType) {
  const user = userRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return accountRepository.create(userId, accountType);
}

function getAccount(accountId) {
  const account = accountRepository.findById(accountId);
  if (!account) {
    throw new Error('Account not found');
  }
  return account;
}

function deposit(accountId, amount) {
  if (amount <= 0) {
    throw new Error('Deposit amount must be positive');
  }
  const account = getAccount(accountId);
  account.balance = Number(account.balance) + Number(amount);
  transactionRepository.create(accountId, 'DEPOSIT', amount);
  return account;
}

function withdraw(accountId, amount) {
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

function getTransactions(accountId) {
  getAccount(accountId);
  return transactionRepository.findByAccountId(accountId);
}

module.exports = { createAccount, getAccount, deposit, withdraw, getTransactions };
