import { useState } from 'react';
import * as api from './api';
import type { Account, Transaction } from './api';

export default function App() {
  const [userId, setUserId] = useState('1');
  const [accountType, setAccountType] = useState('SAVINGS');
  const [accountIdInput, setAccountIdInput] = useState('1');
  const [amount, setAmount] = useState('100');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsAccountId, setTransactionsAccountId] = useState<number | null>(null);
  const [error, setError] = useState('');

  //Update accounts list if account exists, insert into list if not
  function upsertAccount(updated: Account) {
    setAccounts((prev) => {
      const index = prev.findIndex((a) => a.account_id === updated.account_id);
      if (index === -1) {
        return [...prev, updated];
      }
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  //Wrapper for onClick to reduce try/catch boilerplate
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
        <button onClick={() => run(async () => upsertAccount(await api.createAccount(Number(userId), accountType)))}>
          Create
        </button>
      </section>

      <section>
        <h2>Account Actions</h2>
        <input value={accountIdInput} onChange={(e) => setAccountIdInput(e.target.value)} placeholder="accountId" />
        <button onClick={() => run(async () => upsertAccount(await api.getAccount(Number(accountIdInput))))}>
          Fetch
        </button>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="amount" />
        <button onClick={() => run(async () => upsertAccount(await api.deposit(Number(accountIdInput), Number(amount))))}>
          Deposit
        </button>
        <button onClick={() => run(async () => upsertAccount(await api.withdraw(Number(accountIdInput), Number(amount))))}>
          Withdraw
        </button>
        <button
          onClick={() =>
            run(async () => {
              const id = Number(accountIdInput);
              setTransactions(await api.getTransactions(id));
              setTransactionsAccountId(id);
            })
          }
        >
          Load Transactions
        </button>
      </section>

      <section>
        <h3>Accounts ({accounts.length})</h3>
        {accounts.length === 0 ? (
          <p>No accounts yet — create one above.</p>
        ) : (
          <table border={1} cellPadding={6} style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>account_id</th>
                <th>user_id</th>
                <th>account_type</th>
                <th>balance</th>
                <th>created_at</th>
              </tr>
            </thead>
            <tbody>
              {[...accounts]
                .sort((a, b) => a.account_id - b.account_id)
                .map((a) => (
                  <tr key={a.account_id}>
                    <td>{a.account_id}</td>
                    <td>{a.user_id}</td>
                    <td>{a.account_type}</td>
                    <td>{a.balance}</td>
                    <td>{a.created_at}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>

      {transactionsAccountId !== null && (
        <section>
          <h3>Transactions for account {transactionsAccountId}</h3>
          <pre>{JSON.stringify(transactions, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
