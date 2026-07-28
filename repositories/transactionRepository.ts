import { Transaction, TransactionType } from '../models/transaction';

const transactions: Transaction[] = [];
let nextTxnId = 1;

function create(
  accountId: number,
  txnType: TransactionType,
  amount: number,
  relatedAccountId: number | null = null,
): Transaction {
  const txn = new Transaction(nextTxnId++, accountId, txnType, amount, relatedAccountId);
  transactions.push(txn);
  return txn;
}

function findById(txnId: number): Transaction | undefined {
  return transactions.find((t) => t.txn_id === txnId);
}

function findByAccountId(accountId: number): Transaction[] {
  return transactions.filter((t) => t.account_id === accountId);
}

function deleteById(txnId: number): boolean {
  const index = transactions.findIndex((t) => t.txn_id === txnId);
  if (index === -1) {
    return false;
  }
  transactions.splice(index, 1);
  return true;
}

function deleteByAccountId(accountId: number): void {
  for (let i = transactions.length - 1; i >= 0; i--) {
    if (transactions[i].account_id === accountId) {
      transactions.splice(i, 1);
    }
  }
}

export default { create, findById, findByAccountId, deleteById, deleteByAccountId };
