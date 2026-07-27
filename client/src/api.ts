export interface Account {
  account_id: number;
  user_id: number;
  account_type: string;
  balance: number;
  created_at: string;
}

export interface Transaction {
  txn_id: number;
  account_id: number;
  txn_type: string;
  amount: number;
  created_at: string;
}

const BASE_URL = '/api/accounts';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}

export function createAccount(userId: number, accountType: string): Promise<Account> {
  return fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, accountType }),
  }).then((res) => handleResponse<Account>(res));
}

export function getAccount(accountId: number): Promise<Account> {
  return fetch(`${BASE_URL}/${accountId}`).then((res) => handleResponse<Account>(res));
}

export function deposit(accountId: number, amount: number): Promise<Account> {
  return fetch(`${BASE_URL}/${accountId}/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  }).then((res) => handleResponse<Account>(res));
}

export function withdraw(accountId: number, amount: number): Promise<Account> {
  return fetch(`${BASE_URL}/${accountId}/withdraw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  }).then((res) => handleResponse<Account>(res));
}

export function getTransactions(accountId: number): Promise<Transaction[]> {
  return fetch(`${BASE_URL}/${accountId}/transactions`).then((res) => handleResponse<Transaction[]>(res));
}
