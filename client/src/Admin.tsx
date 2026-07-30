import { useEffect, useState } from 'react';
import * as api from './api';
import type { Account, PublicUser, Transaction } from './api';

interface AdminProps {
  currentUserId: string;
}

export default function Admin({ currentUserId }: AdminProps) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsAccountId, setTransactionsAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [allUsers, allAccounts] = await Promise.all([
        api.adminListUsers(),
        api.adminListAccounts(),
      ]);
      setUsers(allUsers);
      setAccounts(allAccounts);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Same try/catch wrapper pattern as App's action buttons
  async function run(fn: () => Promise<void>) {
    setError('');
    try {
      await fn();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function format_time(isoString: string): string {
    return new Date(isoString).toLocaleString();
  }

  function format_currency(amountCents: number): string {
    return `$${(amountCents / 100).toFixed(2)}`;
  }

  if (loading) {
    return <p>Loading admin data…</p>;
  }

  return (
    <div>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <section>
        <h3>Users ({users.length})</h3>
        <table border={1} cellPadding={6} style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>user_id</th>
              <th>name</th>
              <th>email</th>
              <th>role</th>
              <th>created_at</th>
              <th>actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.user_id === currentUserId;
              return (
                <tr key={u.user_id}>
                  <td>{u.user_id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{format_time(u.created_at)}</td>
                  <td>
                    <button
                      // Backend blocks an admin from revoking their own role; disable it here too
                      disabled={isSelf && u.role === 'admin'}
                      onClick={() =>
                        run(async () => {
                          const updated = await api.adminSetUserRole(
                            u.user_id,
                            u.role === 'admin' ? 'user' : 'admin',
                          );
                          setUsers((prev) =>
                            prev.map((x) => (x.user_id === updated.user_id ? updated : x)),
                          );
                        })
                      }
                    >
                      {u.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>{' '}
                    <button
                      disabled={isSelf}
                      onClick={() =>
                        run(async () => {
                          await api.adminDeleteUser(u.user_id);
                          setUsers((prev) => prev.filter((x) => x.user_id !== u.user_id));
                        })
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Accounts ({accounts.length})</h3>
        <table border={1} cellPadding={6} style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>account_id</th>
              <th>user_id</th>
              <th>account_type</th>
              <th>balance</th>
              <th>created_at</th>
              <th>actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.account_id}>
                <td>{a.account_id}</td>
                <td>{a.user_id}</td>
                <td>{a.account_type}</td>
                <td>{format_currency(a.balance_cents)}</td>
                <td>{format_time(a.created_at)}</td>
                <td>
                  <button
                    onClick={() =>
                      run(async () => {
                        const accountTransactions = await api.adminGetAccountTransactions(
                          a.account_id,
                        );
                        setTransactions(accountTransactions);
                        setTransactionsAccountId(a.account_id);
                      })
                    }
                  >
                    View Transactions
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
