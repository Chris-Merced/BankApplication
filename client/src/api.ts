export interface Account {
  account_id: string;
  user_id: string;
  account_type: string;
  balance_cents: number;
  created_at: string;
}

export interface Transaction {
  txn_id: string;
  account_id: string;
  txn_type: string;
  amount_cents: number;
  related_account_id: string | null;
  idempotency_key?: string;
  created_at: string;
}

export interface TransferResult {
  from: Account;
  to: Account;
}

export type UserRole = 'user' | 'admin';

export interface PublicUser {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

interface AuthResult {
  user: PublicUser;
  token: string;
}

const ACCOUNT_URL = '/api/accounts';
const AUTH_URL = '/api/auth';
const ADMIN_URL = '/api/admin';
const TOKEN_KEY = 'bank_application_token';
export const AUTH_EXPIRED_EVENT = 'bank-application-auth-expired';

function getToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

function authHeaders(includeJson = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function moneyHeaders(): Record<string, string> {
  return {
    ...authHeaders(true),
    'Idempotency-Key': window.crypto.randomUUID(),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  let data: unknown;

  if (isJson) {
    try {
      data = await res.json();
    } catch {
      throw new Error('The API returned an invalid JSON response');
    }
  } else {
    await res.text();
    data = undefined;
  }

  if (!res.ok) {
    if (res.status === 401) {
      logout();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    if (
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof data.error === 'string'
    ) {
      throw new Error(data.error);
    }

    if (res.status >= 500) {
      throw new Error('The API is unavailable. Please try again');
    }

    throw new Error(`The API returned an unexpected response (${res.status})`);
  }

  if (!isJson) {
    throw new Error('The API returned an unexpected non-JSON response');
  }

  return data as T;
}

//TODO: Send token in cookie for more robust security
async function authenticate(
  path: '/register' | '/login',
  body: Record<string, string>,
): Promise<PublicUser> {
  const result = await fetch(`${AUTH_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((res) => handleResponse<AuthResult>(res));
  window.localStorage.setItem(TOKEN_KEY, result.token);
  return result.user;
}

export function register(
  name: string,
  email: string,
  password: string,
): Promise<PublicUser> {
  return authenticate('/register', { name, email, password });
}

export function login(
  email: string,
  password: string,
): Promise<PublicUser> {
  return authenticate('/login', { email, password });
}

export function logout(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function hasToken(): boolean {
  return getToken() !== null;
}

export function getCurrentUser(): Promise<PublicUser> {
  return fetch('/api/users/me', {
    headers: authHeaders(),
  }).then((res) => handleResponse<PublicUser>(res));
}

export function getAccounts(): Promise<Account[]> {
  return fetch(ACCOUNT_URL, {
    headers: authHeaders(),
  }).then((res) => handleResponse<Account[]>(res));
}

export function createAccount(accountType: string): Promise<Account> {
  return fetch(ACCOUNT_URL, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify({ accountType }),
  }).then((res) => handleResponse<Account>(res));
}

export function getAccount(accountId: string): Promise<Account> {
  return fetch(`${ACCOUNT_URL}/${accountId}`, {
    headers: authHeaders(),
  }).then((res) => handleResponse<Account>(res));
}

export function deposit(
  accountId: string,
  amountCents: number,
): Promise<Account> {
  return fetch(`${ACCOUNT_URL}/${accountId}/deposit`, {
    method: 'POST',
    headers: moneyHeaders(),
    body: JSON.stringify({ amountCents }),
  }).then((res) => handleResponse<Account>(res));
}

export function withdraw(
  accountId: string,
  amountCents: number,
): Promise<Account> {
  return fetch(`${ACCOUNT_URL}/${accountId}/withdraw`, {
    method: 'POST',
    headers: moneyHeaders(),
    body: JSON.stringify({ amountCents }),
  }).then((res) => handleResponse<Account>(res));
}

export function transfer(
  fromAccountId: string,
  toAccountId: string,
  amountCents: number,
): Promise<TransferResult> {
  return fetch(`${ACCOUNT_URL}/${fromAccountId}/transfer`, {
    method: 'POST',
    headers: moneyHeaders(),
    body: JSON.stringify({ toAccountId, amountCents }),
  }).then((res) => handleResponse<TransferResult>(res));
}

export function getTransactions(
  accountId: string,
): Promise<Transaction[]> {
  return fetch(`${ACCOUNT_URL}/${accountId}/transactions`, {
    headers: authHeaders(),
  }).then((res) => handleResponse<Transaction[]>(res));
}

export function adminListUsers(): Promise<PublicUser[]> {
  return fetch(`${ADMIN_URL}/users`, {
    headers: authHeaders(),
  }).then((res) => handleResponse<PublicUser[]>(res));
}

export function adminSetUserRole(
  userId: string,
  role: UserRole,
): Promise<PublicUser> {
  return fetch(`${ADMIN_URL}/users/${userId}/role`, {
    method: 'PATCH',
    headers: authHeaders(true),
    body: JSON.stringify({ role }),
  }).then((res) => handleResponse<PublicUser>(res));
}

export function adminDeleteUser(userId: string): Promise<void> {
  return fetch(`${ADMIN_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).then((res) => handleResponse<void>(res));
}

export function adminListAccounts(): Promise<Account[]> {
  return fetch(`${ADMIN_URL}/accounts`, {
    headers: authHeaders(),
  }).then((res) => handleResponse<Account[]>(res));
}

export function adminGetAccountTransactions(
  accountId: string,
): Promise<Transaction[]> {
  return fetch(`${ADMIN_URL}/accounts/${accountId}/transactions`, {
    headers: authHeaders(),
  }).then((res) => handleResponse<Transaction[]>(res));
}
