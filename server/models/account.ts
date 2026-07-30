import { ObjectId, WithId } from 'mongodb';

export type AccountType = 'CHECKING' | 'SAVINGS';

export const ACCOUNT_TYPES: AccountType[] = ['CHECKING', 'SAVINGS'];

export interface Account {
  user_id: ObjectId;
  account_type: AccountType;
  balance_cents: number;
  created_at: string;
}

export interface AccountResponse {
  account_id: string;
  user_id: string;
  account_type: AccountType;
  balance_cents: number;
  created_at: string;
}

export function createAccountDocument(
  userId: ObjectId,
  accountType: AccountType,
): Account {
  return {
    user_id: userId,
    account_type: accountType,
    balance_cents: 0,
    created_at: new Date().toISOString(),
  };
}

export function toAccountResponse(
  account: WithId<Account>,
): AccountResponse {
  return {
    account_id: account._id.toHexString(),
    user_id: account.user_id.toHexString(),
    account_type: account.account_type,
    balance_cents: account.balance_cents,
    created_at: account.created_at,
  };
}
