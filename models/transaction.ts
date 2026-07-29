export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT';

export class Transaction {
  txn_id: number;
  account_id: number;
  txn_type: TransactionType;
  amount_cents: number;
  related_account_id: number | null; // counterparty account on transfers, null otherwise
  created_at: string;

  constructor(
    id: number,
    accountId: number,
    txnType: TransactionType,
    amountCents: number,
    relatedAccountId: number | null = null,
  ) {
    this.txn_id = id;
    this.account_id = accountId;
    this.txn_type = txnType;
    this.amount_cents = amountCents;
    this.related_account_id = relatedAccountId;
    this.created_at = new Date().toISOString();
  }
}
