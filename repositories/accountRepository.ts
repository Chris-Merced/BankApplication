import { Account } from '../models/account';

const accounts: Account[] = [];
let nextAccountId = 1;

function create(userId: number, accountType: string): Account {
  const account = new Account(nextAccountId++, userId, accountType);
  accounts.push(account);
  return account;
}

function findById(accountId: number): Account | undefined {
  return accounts.find((a) => a.account_id === accountId);
}

function findAll(): Account[] {
  return accounts;
}

export default { create, findById, findAll };
