export type AccountType = 'CHECKING' | 'SAVINGS';

export const ACCOUNT_TYPES: AccountType[] = ['CHECKING', 'SAVINGS'];

export class Account {
  account_id: number;
  user_id: number;
  account_type: AccountType;
  balance_cents: number;
  created_at: string;

  constructor(id: number, userId: number, accountType: AccountType, balanceCents: number = 0) {
    this.account_id = id;
    this.user_id = userId;
    this.account_type = accountType;
    this.balance_cents = balanceCents;
    this.created_at = new Date().toISOString();
  }
}
