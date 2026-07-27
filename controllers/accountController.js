const AccountService = require('../services/AccountService');

function createAccount(req, res) {
  try {
    const { userId, accountType } = req.body;
    if (!userId || !accountType) {
      return res.status(400).json({ error: 'userId and accountType are required' });
    }
    const account = AccountService.createAccount(userId, accountType);
    res.status(201).json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

function getAccount(req, res) {
  try {
    const accountId = Number(req.params.id);
    const account = AccountService.getAccount(accountId);
    res.json(account);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

function deposit(req, res) {
  try {
    const accountId = Number(req.params.id);
    const { amount } = req.body;
    const account = AccountService.deposit(accountId, amount);
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

function withdraw(req, res) {
  try {
    const accountId = Number(req.params.id);
    const { amount } = req.body;
    const account = AccountService.withdraw(accountId, amount);
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

function getTransactions(req, res) {
  try {
    const accountId = Number(req.params.id);
    const transactions = AccountService.getTransactions(accountId);
    res.json(transactions);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
}

module.exports = { createAccount, getAccount, deposit, withdraw, getTransactions };
