export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL';

export class Transaction {
  txn_id: number;
  account_id: number;
  txn_type: TransactionType;
  amount: number;
  created_at: string;

  constructor(id: number, accountId: number, txnType: TransactionType, amount: number) {
    this.txn_id = id;
    this.account_id = accountId;
    this.txn_type = txnType;
    this.amount = amount;
    this.created_at = new Date().toISOString();
  }
}
