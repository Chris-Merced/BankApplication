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
  related_account_id: number | null;
  created_at: string;
}

export interface TransferResult {
  from: Account;
  to: Account;
}

// The password hash is stripped server-side by toPublicUser, so it never reaches the client
export interface PublicUser {
  user_id: number;
  name: string;
  email: string;
  created_at: string;
}

const BASE_URL = '/api/accounts';
const USERS_URL = '/api/users';

// Parses every API response into JavaScript object - throws error on non-ok response
async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}

// Password is sent once and hashed with bcrypt server-side; only the hash is stored
export function register(name: string, email: string, password: string): Promise<PublicUser> {
  return fetch(USERS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  }).then((res) => handleResponse<PublicUser>(res));
}

export function login(email: string, password: string): Promise<PublicUser> {
  return fetch(`${USERS_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then((res) => handleResponse<PublicUser>(res));
}

export function getAccountsForUser(userId: number): Promise<Account[]> {
  return fetch(`${BASE_URL}?userId=${userId}`).then((res) => handleResponse<Account[]>(res));
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

// Resolves to both sides of the transfer so the caller can refresh each balance
export function transfer(fromAccountId: number, toAccountId: number, amount: number): Promise<TransferResult> {
  return fetch(`${BASE_URL}/${fromAccountId}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toAccountId, amount }),
  }).then((res) => handleResponse<TransferResult>(res));
}

export function getTransactions(accountId: number): Promise<Transaction[]> {
  return fetch(`${BASE_URL}/${accountId}/transactions`).then((res) => handleResponse<Transaction[]>(res));
}
