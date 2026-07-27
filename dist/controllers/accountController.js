"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AccountService_1 = __importDefault(require("../services/AccountService"));
const account_1 = require("../models/account");
function isAccountType(value) {
    return typeof value === 'string' && account_1.ACCOUNT_TYPES.includes(value);
}
function createAccount(req, res) {
    try {
        const { userId, accountType } = req.body;
        if (!userId || !accountType) {
            res.status(400).json({ error: 'userId and accountType are required' });
            return;
        }
        const normalizedType = typeof accountType === 'string' ? accountType.toUpperCase() : accountType;
        if (!isAccountType(normalizedType)) {
            res.status(400).json({ error: `accountType must be one of: ${account_1.ACCOUNT_TYPES.join(', ')}` });
            return;
        }
        const account = AccountService_1.default.createAccount(Number(userId), normalizedType);
        res.status(201).json(account);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
function getAccount(req, res) {
    try {
        const accountId = Number(req.params.id);
        const account = AccountService_1.default.getAccount(accountId);
        res.json(account);
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
}
function deposit(req, res) {
    try {
        const accountId = Number(req.params.id);
        const { amount } = req.body;
        const account = AccountService_1.default.deposit(accountId, Number(amount));
        res.json(account);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
function withdraw(req, res) {
    try {
        const accountId = Number(req.params.id);
        const { amount } = req.body;
        const account = AccountService_1.default.withdraw(accountId, Number(amount));
        res.json(account);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
function getTransactions(req, res) {
    try {
        const accountId = Number(req.params.id);
        const transactions = AccountService_1.default.getTransactions(accountId);
        res.json(transactions);
    }
    catch (err) {
        res.status(404).json({ error: err.message });
    }
}
exports.default = { createAccount, getAccount, deposit, withdraw, getTransactions };
