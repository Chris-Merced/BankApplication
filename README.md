# BankApplication

A simple Express + TypeScript bank account API, with a React frontend.

## Getting Started

```bash
npm install
npm run dev          # start the API (tsx watch index.ts)
npm run client:dev    # start the React frontend (webpack-dev-server)
```

Build for production:

```bash
npm run build         # compile API to dist/
npm run client:build  # bundle the frontend
npm start             # run compiled API
```

## Interactive API Documentation

With the API running, open [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
to browse the Swagger UI and try requests against the API.

The machine-readable OpenAPI 3.1 contract is available at
[http://localhost:3000/openapi.json](http://localhost:3000/openapi.json) and is
maintained in `openapi.json`.

## API Routes

Base URL: `http://localhost:3000`

### General

| Method | Route     | Description              |
|--------|-----------|--------------------------|
| GET    | `/`       | API status check         |
| GET    | `/health` | Health check              |

### Accounts

All account routes are mounted under `/api/accounts`.

| Method | Route                         | Description                     |
|--------|--------------------------------|----------------------------------|
| POST   | `/api/accounts`                | Create a new account             |
| GET    | `/api/accounts/:id`            | Get an account by ID             |
| POST   | `/api/accounts/:id/deposit`    | Deposit funds into an account    |
| POST   | `/api/accounts/:id/withdraw`   | Withdraw funds from an account   |
| GET    | `/api/accounts/:id/transactions` | Get transaction history for an account |

#### `POST /api/accounts`

Create an account for an existing user.

**Body:**
```json
{
  "userId": 1,
  "accountType": "CHECKING"
}
```
`accountType` must be one of `CHECKING`, `SAVINGS` (case-insensitive).

**Responses:**
- `201` — created account
- `400` — missing/invalid `userId` or `accountType`

#### `GET /api/accounts/:id`

Retrieve an account by its ID.

**Responses:**
- `200` — account object
- `404` — account not found

#### `POST /api/accounts/:id/deposit`

Deposit funds into an account.

**Body:**
```json
{
  "amount": 100
}
```

**Responses:**
- `200` — updated account
- `400` — invalid amount or account not found

#### `POST /api/accounts/:id/withdraw`

Withdraw funds from an account.

**Body:**
```json
{
  "amount": 50
}
```

**Responses:**
- `200` — updated account
- `400` — invalid amount, insufficient funds, or account not found

#### `GET /api/accounts/:id/transactions`

Retrieve the transaction history for an account.

**Responses:**
- `200` — array of transactions
- `404` — account not found

### Data Models

**Account**
```ts
{
  account_id: number;
  user_id: number;
  account_type: 'CHECKING' | 'SAVINGS';
  balance: number;
  created_at: string;
}
```

**Transaction**
```ts
{
  txn_id: number;
  account_id: number;
  txn_type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  created_at: string;
}
```

## Planned / TODO

- **Auth** — routes are currently unauthenticated; any caller can create accounts or move funds for any `userId`. Add authentication and athuorization to api routes.

