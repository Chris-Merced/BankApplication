export type AccountType = 'CHECKING' | 'SAVINGS';

export const ACCOUNT_TYPES: AccountType[] = ['CHECKING', 'SAVINGS'];

//TODO: Implement forced integer sanitization for cents instead of allowing float
export class Account {
  account_id: number;
  user_id: number;
  account_type: AccountType;
  balance: number; 
  created_at: string;

  constructor(id: number, userId: number, accountType: AccountType, balance: number = 0) {
    this.account_id = id;
    this.user_id = userId;
    this.account_type = accountType;
    this.balance = balance;
    this.created_at = new Date().toISOString();
  }
}
