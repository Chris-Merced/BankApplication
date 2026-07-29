import { useState } from 'react';
import * as api from './api';
import Auth from './Auth';
import type { Account, PublicUser, Transaction } from './api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [accountType, setAccountType] = useState('SAVINGS');
  // The signed-in user picks one of their own accounts instead of typing an ID
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
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

  // Accepts cents (the wire/storage unit) and renders it as a dollar amount
  function format_currency(amountCents: number): string {
    if (isNaN(amountCents)){
      return "";
    }
    return `$${(amountCents / 100).toFixed(2)}`;
  }

  // The UI collects dollar amounts from the user; the API speaks in integer cents
  function dollars_to_cents(dollars: string): number {
    return Math.round(Number(dollars) * 100);
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
        return sum + tx.amount_cents;
      }

      if (tx.txn_type === 'WITHDRAWAL') {
        return sum - tx.amount_cents;
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

  // Pulls the user's existing accounts straight away so the table isn't empty on arrival
  async function handleAuthenticated(user: PublicUser) {
    setCurrentUser(user);
    setError('');
    try {
      const userAccounts = await api.getAccountsForUser(user.user_id);
      setAccounts(userAccounts);
      // Preselect one so Deposit/Withdraw are usable without any extra clicks
      setSelectedAccountId(userAccounts.length > 0 ? userAccounts[0].account_id : null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // Clears every piece of account state so the next user never sees the previous one's data
  function handleLogout() {
    setCurrentUser(null);
    setAccounts([]);
    setSelectedAccountId(null);
    setTransactions([]);
    setTransactionsAccountId(null);
    setAccountMonthDeltas({});
    setError('');
  }

  if (!currentUser) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Bank Application</h1>
        <div>
          <span style={{ marginRight: 8 }}>
            {currentUser.name} ({currentUser.email})
          </span>
          <button onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <section>
        <h2>Create Account</h2>
        {/* Owner comes from the session rather than a typed-in userId */}
        <select value={accountType} onChange={(e) => setAccountType(e.target.value)}>
          <option value="SAVINGS">SAVINGS</option>
          <option value="CHECKING">CHECKING</option>
        </select>
        <button
          onClick={() =>
            run(async () => {
              const created = await api.createAccount(currentUser.user_id, accountType);
              await upsertAccount(created);
              // Their first account becomes the selection; later ones don't steal it
              setSelectedAccountId((prev) => prev ?? created.account_id);
            })
          }
        >
          Create
        </button>
      </section>

      <section>
        <h2>Account Actions</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <label>
            Recent window:
            <select value={deltaUnit} onChange={(e) => setDeltaUnit(e.target.value as 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year')}>
              <option value="second">Second(s)</option>
              <option value="minute">Minute(s)</option>
              <option value="hour">Hour(s)</option>
              <option value="month">Month(s)</option>
              <option value="year">Year(s)</option>
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
        {accounts.length === 0 ? (
          <p>Create an account above to deposit or withdraw.</p>
        ) : (
          <>
            <select
              value={selectedAccountId ?? ''}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
            >
              {[...accounts]
                .sort((a, b) => a.account_id - b.account_id)
                .map((a) => (
                  <option key={a.account_id} value={a.account_id}>
                    {a.account_type} #{a.account_id} — {format_currency(a.balance_cents)}
                  </option>
                ))}
            </select>
            <button onClick={() => run(async () => upsertAccount(await api.getAccount(selectedAccountId!)))}>
              Refresh
            </button>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="amount" />
            <button onClick={() => run(async () => upsertAccount(await api.deposit(selectedAccountId!, dollars_to_cents(amount))))}>
              Deposit
            </button>
            <button onClick={() => run(async () => upsertAccount(await api.withdraw(selectedAccountId!, dollars_to_cents(amount))))}>
              Withdraw
            </button>
            <button
              onClick={() =>
                run(async () => {
                  const id = selectedAccountId!;
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
          </>
        )}
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
                dollars_to_cents(transferAmount),
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
                  //change row color based on whether the account has had a net deposit or withdrawal in the recent window
                  const monthDelta = accountMonthDeltas[a.account_id] ?? 0;
                  const rowBackground = monthDelta < 0 ? '#fbeaea' : monthDelta > 0 ? '#ebf8eb' : 'transparent';
                  
                  return (
                    <tr key={a.account_id} style={{ backgroundColor: rowBackground }}>
                      <td>{a.account_id}</td>
                      <td>{a.user_id}</td>
                      <td>{a.account_type}</td>
                      <td>{format_currency(a.balance_cents)}</td>
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
        style={{//style the transactions section to have a max height and scroll if needed
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
