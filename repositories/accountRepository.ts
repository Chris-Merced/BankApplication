import { Account, AccountType } from '../models/account';

const accounts: Account[] = [];
let nextAccountId = 1;

function create(userId: number, accountType: AccountType): Account {
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

function findByUserId(userId: number): Account[] {
  return accounts.filter((a) => a.user_id === userId);
}

function update(account: Account): Account {
  const index = accounts.findIndex((a) => a.account_id === account.account_id);
  if (index === -1) {
    throw new Error('Account not found');
  }
  accounts[index] = account;
  return accounts[index];
}

function deleteById(accountId: number): boolean {
  const index = accounts.findIndex((a) => a.account_id === accountId);
  if (index === -1) {
    return false;
  }
  accounts.splice(index, 1);
  return true;
}

export default { create, findById, findAll, findByUserId, update, deleteById };
