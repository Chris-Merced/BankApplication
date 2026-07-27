import { useState } from 'react';
import * as api from './api';
import type { Account, Transaction } from './api';

export default function App() {
  const [userId, setUserId] = useState('1');
  const [accountType, setAccountType] = useState('SAVINGS');
  const [accountIdInput, setAccountIdInput] = useState('1');
  const [amount, setAmount] = useState('100');
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');

  async function run(fn: () => Promise<void>) {
    setError('');
    try {
      await fn();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <h1>Bank Application</h1>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <section>
        <h2>Create Account</h2>
        <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="userId" />
        <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
          <option value="SAVINGS">SAVINGS</option>
          <option value="CHECKING">CHECKING</option>
        </select>
        <button onClick={() => run(async () => setAccount(await api.createAccount(Number(userId), accountType)))}>
          Create
        </button>
      </section>

      <section>
        <h2>Account</h2>
        <input value={accountIdInput} onChange={(e) => setAccountIdInput(e.target.value)} placeholder="accountId" />
        <button onClick={() => run(async () => setAccount(await api.getAccount(Number(accountIdInput))))}>
          Fetch
        </button>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="amount" />
        <button onClick={() => run(async () => setAccount(await api.deposit(Number(accountIdInput), Number(amount))))}>
          Deposit
        </button>
        <button onClick={() => run(async () => setAccount(await api.withdraw(Number(accountIdInput), Number(amount))))}>
          Withdraw
        </button>
        <button onClick={() => run(async () => setTransactions(await api.getTransactions(Number(accountIdInput))))}>
          Load Transactions
        </button>
      </section>

      {account && (
        <section>
          <h3>Account Details</h3>
          <pre>{JSON.stringify(account, null, 2)}</pre>
        </section>
      )}

      {transactions.length > 0 && (
        <section>
          <h3>Transactions</h3>
          <pre>{JSON.stringify(transactions, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
