# BankApplication

An authenticated Express + TypeScript bank account API backed by MongoDB Atlas,
with a React frontend and interactive OpenAPI documentation.

## Prerequisites

- Node.js
- A MongoDB Atlas project with a running deployment
- A MongoDB database user
- Your development IP in the Atlas project IP access list

## Configuration

Copy `.env.example` to `.env` and replace the placeholders:

```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB=bankapp
JWT_SECRET=replace-with-a-random-secret-of-at-least-32-characters
PORT=3000
```

Generate a JWT secret with:

```bash
openssl rand -base64 48
```

Never commit `.env` or expose `MONGODB_URI` or `JWT_SECRET` to the React client.

## Getting Started

```bash
npm install
npm run dev
```

In a second terminal:

```bash
npm run client:dev
```

Run both development servers together:

```bash
npm run dev:all
```

Production builds:

```bash
npm run build
npm run client:build
npm start
```

## Authentication

Register:

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "correct-horse-battery-staple"
}
```

Log in:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "correct-horse-battery-staple"
}
```

Both endpoints return a one-hour JWT:

```json
{
  "user": {
    "user_id": 1,
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "status": "ACTIVE"
  },
  "token": "..."
}
```

Send the token with every protected request:

```http
Authorization: Bearer <token>
```

Account operations enforce ownership. A user can debit only their own source
account, while a transfer may credit another user's active account.

## Money Values

The API and MongoDB store all monetary values as integer cents:

```json
{
  "amountCents": 12550
}
```

represents `$125.50`. Responses use `balance_cents` and `amount_cents`.

Deposits, withdrawals, and transfers also require a unique retry-protection
header:

```http
Idempotency-Key: 6748302e-08c5-4ce9-966a-bef8479aec15
```

Reusing a key returns `409 Conflict` without applying the balance change again.

Existing development documents that use the old floating-point `balance` and
`amount` fields are converted to cents during database initialization.

## API Routes

Public routes:

| Method | Route | Description |
|---|---|---|
| GET | `/` | API status |
| GET | `/health` | Application and database readiness |
| GET | `/health/live` | Process liveness |
| POST | `/api/auth/register` | Register and receive a token |
| POST | `/api/auth/login` | Log in and receive a token |

Protected user routes:

| Method | Route | Description |
|---|---|---|
| GET | `/api/users/me` | Get the authenticated user |
| PATCH | `/api/users/me` | Update the authenticated user |
| DELETE | `/api/users/me` | Close the user and zero-balance accounts |

Protected account routes:

| Method | Route | Description |
|---|---|---|
| POST | `/api/accounts` | Create an account for the authenticated user |
| GET | `/api/accounts/:id` | Get an owned account |
| POST | `/api/accounts/:id/deposit` | Deposit into an owned account |
| POST | `/api/accounts/:id/withdraw` | Withdraw from an owned account |
| POST | `/api/accounts/:id/transfer` | Transfer from an owned account |
| GET | `/api/accounts/:id/transactions` | Get immutable transaction history |
| DELETE | `/api/accounts/:id` | Close a zero-balance account |

Closing users and accounts is a soft operation. Account and transaction
documents are retained, and there is no transaction-deletion endpoint.

## Swagger

With the API running, open:

```text
http://localhost:3000/api-docs
```

To call protected endpoints:

1. Run `POST /api/auth/register` or `POST /api/auth/login`.
2. Copy the returned token.
3. Select **Authorize**.
4. Paste the token into the bearer authentication field.

The machine-readable OpenAPI 3.1 contract is available at:

```text
http://localhost:3000/openapi.json
```

## MongoDB Behavior

At startup the API:

1. Connects to Atlas and verifies the connection with a ping.
2. Converts legacy money fields to integer cents.
3. Normalizes existing user email fields.
4. Creates unique and query indexes.
5. Seeds atomic numeric-ID counters from existing data.
6. Starts Express only after initialization succeeds.

Deposits, withdrawals, transfers, and closure cascades use MongoDB sessions and
transactions. Withdrawals use a conditional balance update to prevent concurrent
requests from overdrawing an account.

The server closes its MongoDB connection on `SIGINT` and `SIGTERM`.

## Current Security Scope

- Passwords are hashed with bcrypt.
- Access tokens expire after one hour.
- Closed users cannot authenticate or use an existing token.
- Account routes enforce ownership.
- Transaction history is immutable.
- Money operations reject duplicate idempotency keys.

## TODO

- Update the bare-bones frontend to support registration and login, attach the
  bearer token to protected requests, use the authenticated user instead of a
  manually entered user ID, send integer-cent money fields and idempotency keys,
  and display the updated account and transaction response shapes.
