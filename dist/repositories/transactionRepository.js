"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transaction_1 = require("../models/transaction");
const transactions = [];
let nextTxnId = 1;
function create(accountId, txnType, amount) {
    const txn = new transaction_1.Transaction(nextTxnId++, accountId, txnType, amount);
    transactions.push(txn);
    return txn;
}
function findByAccountId(accountId) {
    return transactions.filter((t) => t.account_id === accountId);
}
exports.default = { create, findByAccountId };
