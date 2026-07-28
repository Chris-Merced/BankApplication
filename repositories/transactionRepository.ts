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

function findByAccountId(accountId: number): Transaction[] {
  return transactions.filter((t) => t.account_id === accountId);
}

export default { create, findByAccountId };
