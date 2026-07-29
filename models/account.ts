export type AccountType = 'CHECKING' | 'SAVINGS';
export type AccountStatus = 'ACTIVE' | 'CLOSED';

export const ACCOUNT_TYPES: AccountType[] = ['CHECKING', 'SAVINGS'];

export class Account {
  account_id: number;
  user_id: number;
  account_type: AccountType;
  balance_cents: number;
  status: AccountStatus;
  created_at: string;
  closed_at: string | null;

  constructor(
    id: number,
    userId: number,
    accountType: AccountType,
    balanceCents = 0,
  ) {
    this.account_id = id;
    this.user_id = userId;
    this.account_type = accountType;
    this.balance_cents = balanceCents;
    this.status = 'ACTIVE';
    this.created_at = new Date().toISOString();
    this.closed_at = null;
  }
}
