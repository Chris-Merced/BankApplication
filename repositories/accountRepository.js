const Account = require('../models/account');

const accounts = [];
let nextAccountId = 1;

function create(userId, accountType) {
  const account = new Account(nextAccountId++, userId, accountType);
  accounts.push(account);
  return account;
}

function findById(accountId) {
  return accounts.find((a) => a.account_id === accountId);
}

function findAll() {
  return accounts;
}

module.exports = { create, findById, findAll };
