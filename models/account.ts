export class Account {
  account_id: number;
  user_id: number;
  account_type: string;
  balance: number;
  created_at: string;

  constructor(id: number, userId: number, accountType: string, balance: number = 0) {
    this.account_id = id;
    this.user_id = userId;
    this.account_type = accountType;
    this.balance = balance;
    this.created_at = new Date().toISOString();
  }
}
