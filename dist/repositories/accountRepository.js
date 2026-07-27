"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const account_1 = require("../models/account");
const accounts = [];
let nextAccountId = 1;
function create(userId, accountType) {
    const account = new account_1.Account(nextAccountId++, userId, accountType);
    accounts.push(account);
    return account;
}
function findById(accountId) {
    return accounts.find((a) => a.account_id === accountId);
}
function findAll() {
    return accounts;
}
exports.default = { create, findById, findAll };
