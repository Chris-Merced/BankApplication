const Transaction = require('../models/transaction');

const transactions = [];
let nextTxnId = 1;

function create(accountId, txnType, amount) {
  const txn = new Transaction(nextTxnId++, accountId, txnType, amount);
  transactions.push(txn);
  return txn;
}

function findByAccountId(accountId) {
  return transactions.filter((t) => t.account_id === accountId);
}

module.exports = { create, findByAccountId };
