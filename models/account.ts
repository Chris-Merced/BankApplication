import { ObjectId, WithId } from 'mongodb';

export type AccountType = 'CHECKING' | 'SAVINGS';
export type AccountStatus = 'ACTIVE' | 'CLOSED';

export const ACCOUNT_TYPES: AccountType[] = ['CHECKING', 'SAVINGS'];

export interface Account {
  user_id: ObjectId;
  account_type: AccountType;
  balance_cents: number;
  status: AccountStatus;
  created_at: string;
  closed_at: string | null;
}

export interface AccountResponse {
  account_id: string;
  user_id: string;
  account_type: AccountType;
  balance_cents: number;
  status: AccountStatus;
  created_at: string;
  closed_at: string | null;
}

export function createAccountDocument(
  userId: ObjectId,
  accountType: AccountType,
): Account {
  return {
    user_id: userId,
    account_type: accountType,
    balance_cents: 0,
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
    closed_at: null,
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
    status: account.status,
    created_at: account.created_at,
    closed_at: account.closed_at,
  };
}
