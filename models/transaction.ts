import { ObjectId, WithId } from 'mongodb';

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT';

export interface Transaction {
  account_id: ObjectId;
  txn_type: TransactionType;
  amount_cents: number;
  related_account_id: ObjectId | null;
  idempotency_key?: string;
  created_at: string;
}

export interface TransactionResponse {
  txn_id: string;
  account_id: string;
  txn_type: TransactionType;
  amount_cents: number;
  related_account_id: string | null;
  idempotency_key?: string;
  created_at: string;
}

export function createTransactionDocument(
  accountId: ObjectId,
  txnType: TransactionType,
  amountCents: number,
  relatedAccountId: ObjectId | null,
  idempotencyKey?: string,
): Transaction {
  return {
    account_id: accountId,
    txn_type: txnType,
    amount_cents: amountCents,
    related_account_id: relatedAccountId,
    ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
    created_at: new Date().toISOString(),
  };
}

export function toTransactionResponse(
  transaction: WithId<Transaction>,
): TransactionResponse {
  return {
    txn_id: transaction._id.toHexString(),
    account_id: transaction.account_id.toHexString(),
    txn_type: transaction.txn_type,
    amount_cents: transaction.amount_cents,
    related_account_id:
      transaction.related_account_id?.toHexString() ?? null,
    ...(transaction.idempotency_key
      ? { idempotency_key: transaction.idempotency_key }
      : {}),
    created_at: transaction.created_at,
  };
}
