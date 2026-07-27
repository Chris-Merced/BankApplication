import { Request, Response } from 'express';
import AccountService from '../services/AccountService';

function createAccount(req: Request, res: Response): void {
  try {
    const { userId, accountType } = req.body;
    if (!userId || !accountType) {
      res.status(400).json({ error: 'userId and accountType are required' });
      return;
    }
    const account = AccountService.createAccount(Number(userId), accountType);
    res.status(201).json(account);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

function getAccount(req: Request, res: Response): void {
  try {
    const accountId = Number(req.params.id);
    const account = AccountService.getAccount(accountId);
    res.json(account);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}

function deposit(req: Request, res: Response): void {
  try {
    const accountId = Number(req.params.id);
    const { amount } = req.body;
    const account = AccountService.deposit(accountId, Number(amount));
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

function withdraw(req: Request, res: Response): void {
  try {
    const accountId = Number(req.params.id);
    const { amount } = req.body;
    const account = AccountService.withdraw(accountId, Number(amount));
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

function getTransactions(req: Request, res: Response): void {
  try {
    const accountId = Number(req.params.id);
    const transactions = AccountService.getTransactions(accountId);
    res.json(transactions);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}

export default { createAccount, getAccount, deposit, withdraw, getTransactions };
