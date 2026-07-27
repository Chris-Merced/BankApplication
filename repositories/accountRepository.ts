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

function update(account: Account): Account {
  const index = accounts.findIndex((a) => a.account_id === account.account_id);
  if (index === -1) {
    throw new Error('Account not found');
  }
  accounts[index] = account;
  return accounts[index];
}

export default { create, findById, findAll, update };
