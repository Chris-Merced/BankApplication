import { useState } from 'react';
import * as api from './api';
import type { Account, Transaction } from './api';

export default function App() {
  const [userId, setUserId] = useState('1');
  const [accountType, setAccountType] = useState('SAVINGS');
  const [accountIdInput, setAccountIdInput] = useState('1');
  const [amount, setAmount] = useState('100');
  // Transfer keeps its own from/to/amount so it never depends on the Account Actions fields
  const [transferFromInput, setTransferFromInput] = useState('1');
  const [transferToInput, setTransferToInput] = useState('2');
  const [transferAmount, setTransferAmount] = useState('100');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsAccountId, setTransactionsAccountId] = useState<number | null>(null);
  const [accountMonthDeltas, setAccountMonthDeltas] = useState<Record<number, number>>({});
  const [deltaUnit, setDeltaUnit] = useState<'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'>('month');
  const [deltaAmount, setDeltaAmount] = useState('1');
  const [error, setError] = useState('');

  /**
  * Single update path for accounts list: every handler (create,
  * fetch, deposit, withdraw) passes the returned account
  * through here and syncs it with the accounts list
  * Always returns a new array so re-render is not skipped
  */
  async function upsertAccount(updated: Account) {
    setAccounts((prev) => {
      const index = prev.findIndex((a) => a.account_id === updated.account_id);
      if (index === -1) {
        return [...prev, updated];
      }
      const next = [...prev];
      next[index] = updated;
      return next;
    });

    try {
      const recentTransactions = await api.getTransactions(updated.account_id);
      setAccountMonthDeltas((prev) => ({
        ...prev,
        [updated.account_id]: getRecentDelta(recentTransactions, deltaUnit, Number(deltaAmount)),
      }));
    } catch {
      setAccountMonthDeltas((prev) => ({
        ...prev,
        [updated.account_id]: 0,
      }));
    }
  }

  function format_time(isoString: string): string{
    const date = new Date(isoString);
    return date.toLocaleString();
  }

  function format_currency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  function getRecentDelta(transactions: Transaction[], unit: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' = 'month', amount = 1): number {
    const now = new Date();
    const startDate = new Date(now);

    if (unit === 'second') {
      startDate.setSeconds(now.getSeconds() - amount);
    } else if (unit === 'minute') {
      startDate.setMinutes(now.getMinutes() - amount);
    } else if (unit === 'hour') {
      startDate.setHours(now.getHours() - amount);
    } else if (unit === 'day') {
      startDate.setDate(now.getDate() - amount);
    } else if (unit === 'week') {
      startDate.setDate(now.getDate() - amount * 7);
    } else if (unit === 'month') {
      startDate.setMonth(now.getMonth() - amount);
    } else if (unit === 'year') {
      startDate.setFullYear(now.getFullYear() - amount);
    }

    return transactions.reduce((sum, tx) => {
      const txDate = new Date(tx.created_at);
      if (txDate < startDate) {
        return sum;
      }

      if (tx.txn_type === 'DEPOSIT') {
        return sum + tx.amount;
      }

      if (tx.txn_type === 'WITHDRAWAL') {
        return sum - tx.amount;
      }

      return sum;
    }, 0);
  }


  // Wrapper for button actions to reduce try/catch boilerplate and handle errors
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <label>
            Recent window:
            <select value={deltaUnit} onChange={(e) => setDeltaUnit(e.target.value as 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year')}>
              <option value="second">Seconds</option>
              <option value="minute">Minutes</option>
              <option value="hour">Hours</option>
              <option value="month">Months</option>
              <option value="year">Years</option>
            </select>
          </label>
          <input
            type="number"
            min="1"
            value={deltaAmount}
            onChange={(e) => setDeltaAmount(e.target.value)}
            placeholder="Amount"
            style={{ width: 80 }}
          />
        </div>
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
              const accountTransactions = await api.getTransactions(id);
              setTransactions(accountTransactions);
              setTransactionsAccountId(id);
              setAccountMonthDeltas((prev) => ({
                ...prev,
                [id]: getRecentDelta(accountTransactions, deltaUnit, Number(deltaAmount)),
              }));
            })
          }
        >
          Load Transactions
        </button>
      </section>

      <section>
        <h2>Transfer</h2>
        <input
          value={transferFromInput}
          onChange={(e) => setTransferFromInput(e.target.value)}
          placeholder="fromAccountId"
        />
        <input
          value={transferToInput}
          onChange={(e) => setTransferToInput(e.target.value)}
          placeholder="toAccountId"
        />
        <input
          value={transferAmount}
          onChange={(e) => setTransferAmount(e.target.value)}
          placeholder="amount"
        />
        <button
          onClick={() =>
            run(async () => {
              // Both sides changed balance, so both are pushed through upsertAccount
              const { from, to } = await api.transfer(
                Number(transferFromInput),
                Number(transferToInput),
                Number(transferAmount),
              );
              upsertAccount(from);
              upsertAccount(to);
            })
          }
        >
          Transfer
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
                .map((a) => {
                  const monthDelta = accountMonthDeltas[a.account_id] ?? 0;
                  const rowBackground = monthDelta < 0 ? '#fbeaea' : monthDelta > 0 ? '#ebf8eb' : 'transparent';

                  return (
                    <tr key={a.account_id} style={{ backgroundColor: rowBackground }}>
                      <td>{a.account_id}</td>
                      <td>{a.user_id}</td>
                      <td>{a.account_type}</td>
                      <td>{format_currency(a.balance)}</td>
                      <td>{format_time(a.created_at)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </section>

      {transactionsAccountId !== null && (
        <section
        style={{
          maxHeight: '300px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '12px',
          borderRadius: '8px',
          background: '#f9f9f9',
          }}
      >
          <h3>Transactions for account {transactionsAccountId}</h3>
          <pre>{JSON.stringify(transactions, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
