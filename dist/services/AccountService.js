"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userRepository_1 = __importDefault(require("../repositories/userRepository"));
const accountRepository_1 = __importDefault(require("../repositories/accountRepository"));
const transactionRepository_1 = __importDefault(require("../repositories/transactionRepository"));
function createAccount(userId, accountType) {
    const user = userRepository_1.default.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    return accountRepository_1.default.create(userId, accountType);
}
function getAccount(accountId) {
    const account = accountRepository_1.default.findById(accountId);
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
    transactionRepository_1.default.create(accountId, 'DEPOSIT', amount);
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
    transactionRepository_1.default.create(accountId, 'WITHDRAWAL', amount);
    return account;
}
function getTransactions(accountId) {
    getAccount(accountId);
    return transactionRepository_1.default.findByAccountId(accountId);
}
exports.default = { createAccount, getAccount, deposit, withdraw, getTransactions };
