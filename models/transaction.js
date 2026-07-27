class Transaction {
  constructor(id, accountId, txnType, amount) {
    this.txn_id = id;
    this.account_id = accountId;
    this.txn_type = txnType;
    this.amount = amount;
    this.created_at = new Date().toISOString();
  }
}

module.exports = Transaction;
