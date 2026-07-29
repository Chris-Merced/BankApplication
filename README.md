# BankApplication — JWT Authentication Branch

This branch extends the Express, TypeScript, MongoDB, and React bank application
with JWT authentication, account ownership checks, MongoDB ObjectIds, atomic
money operations, idempotency protection, and transaction history.

This README is written as a review guide. It explains what changed on
`authenticate-routes`, why the new fields exist, and what reviewers should
verify.

## Important database note

Use a separate, empty review database for this branch:

```env
MONGODB_DB=bankapp_auth
```

The committed `main` branch uses custom numeric IDs, while this branch uses
MongoDB ObjectIds and stores references as ObjectIds. The startup process does
not migrate existing documents, so each branch expects documents matching its
own schema. Running both branches against the same database would create
incompatible records.

Using a separate database name in the same Atlas project is sufficient.

## Summary of branch changes

| Area | Change on this branch |
|---|---|
| Authentication | Registration and login issue one-hour JWT access tokens |
| Authorization | Protected routes derive the user from the token and enforce account ownership |
| IDs | MongoDB `_id`/`ObjectId` replaces custom numeric IDs |
| Email lookup | `email` is normalized for consistent lookup and uniqueness |
| Password storage | Passwords are hashed with bcrypt and never returned |
| Money | Balances and amounts use integer cents |
| Atomicity | Deposits, withdrawals, transfers, and deletion cascades use MongoDB transactions |
| Overdraft protection | Withdrawals use a conditional atomic balance update |
| Retry protection | Money operations require an `Idempotency-Key` header |
| Deletion | Users, accounts, and transaction history can be permanently deleted |
| Documentation | Swagger documents bearer authentication and ObjectId response shapes |
| Frontend | The client stores the JWT, restores the session, and sends authenticated requests |

## Prerequisites

- Node.js
- A MongoDB Atlas project with a running deployment
- A MongoDB database user
- Your development IP in the Atlas IP access list

MongoDB transactions require a deployment that supports sessions and
transactions. Atlas deployments provide this.

## Configuration

Copy `.env.example` to `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.example.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=bankapp_auth
JWT_SECRET=replace-with-a-random-secret-of-at-least-32-characters
PORT=3000
```

Generate a JWT secret with:

```bash
openssl rand -base64 48
```

`JWT_SECRET` must be at least 32 characters. The server validates it before
starting. Keep `.env`, `MONGODB_URI`, and `JWT_SECRET` out of source control and
the React bundle.

## Getting started

```bash
npm install
npm run dev
```

Start the frontend in another terminal:

```bash
npm run client:dev
```

Or run both development servers:

```bash
npm run dev:all
```

Build the API and frontend:

```bash
npm run build
npm run client:build
npm start
```

## Data model guide

MongoDB keeps `_id` internally as an `ObjectId`. API response mappers expose
that value as a 24-character hexadecimal string named `user_id`, `account_id`,
or `txn_id`.

References stay as real `ObjectId` values inside MongoDB. They are converted to
strings only at the API boundary.

### User fields

| Field | Stored type | Purpose |
|---|---|---|
| `_id` | `ObjectId` | MongoDB identity; returned by the API as `user_id` |
| `name` | `string` | User-facing name |
| `email` | `string` | Trimmed, lowercase email used for display, lookup, and uniqueness |
| `hash_password` | `string` | Bcrypt password hash; never returned by the API |
| `created_at` | ISO timestamp | Creation time |

#### Email normalization

Email lookup should treat `Alice@Example.com` and `alice@example.com` as the
same login. The service trims and lowercases email input before storing or
querying the `email` field.

MongoDB creates a unique index on `email`. This protects uniqueness even when
two registrations arrive concurrently. Because the stored address is already
canonical, a separate normalized field is unnecessary.

Example stored document:

```js
{
  _id: ObjectId("68878bbcc4bd68e55f468c08"),
  name: "Alice Johnson",
  email: "alice@example.com",
  hash_password: "$2b$10$...",
  created_at: "2026-07-29T14:00:00.000Z"
}
```

### Account fields

| Field | Stored type | Purpose |
|---|---|---|
| `_id` | `ObjectId` | MongoDB identity; returned as `account_id` |
| `user_id` | `ObjectId` | Reference to the owning user |
| `account_type` | `CHECKING \| SAVINGS` | Account category |
| `balance_cents` | integer | Current balance in cents |
| `created_at` | ISO timestamp | Creation time |

The authenticated user ID comes from the JWT. Account creation does not accept a
caller-provided `userId`.

### Transaction fields

| Field | Stored type | Purpose |
|---|---|---|
| `_id` | `ObjectId` | MongoDB identity; returned as `txn_id` |
| `account_id` | `ObjectId` | Account whose ledger contains the entry |
| `txn_type` | enum | `DEPOSIT`, `WITHDRAWAL`, `TRANSFER_IN`, or `TRANSFER_OUT` |
| `amount_cents` | integer | Positive amount in cents |
| `related_account_id` | `ObjectId` or `null` | Counterparty account for transfers |
| `idempotency_key` | string, optional | Retry key stored on the initiating ledger entry |
| `created_at` | ISO timestamp | Ledger entry time |

A transfer creates two records:

- `TRANSFER_OUT` on the source account
- `TRANSFER_IN` on the destination account

Each entry references the other account through `related_account_id`.

Transactions can be deleted individually. Deleting an account or user also
deletes its associated transaction history.

## JWT authentication

### Registration

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "password": "correct-horse-battery-staple"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "correct-horse-battery-staple"
}
```

Both return:

```json
{
  "user": {
    "user_id": "68878bbcc4bd68e55f468c08",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "created_at": "2026-07-29T14:00:00.000Z"
  },
  "token": "..."
}
```

Send the token on protected requests:

```http
Authorization: Bearer <token>
```

### JWT contents and verification

The access token contains:

- `sub`: the user's MongoDB ObjectId string
- `type`: `access`
- `iss`: `bank-application-api`
- `aud`: `bank-application-client`
- `exp`: one hour after issuance

The middleware verifies the signature, issuer, audience, token type, expiry, and
ObjectId subject. It then loads the user from MongoDB. Deleting a user blocks an
otherwise unexpired token because the referenced user no longer exists.

The verified ObjectId is attached to `req.auth.userId`. Controllers derive
ownership from this value instead of trusting a user ID supplied by the client.

## Authorization and ownership

All account and `/api/users/me` routes require a bearer token.

- Users can list only their own accounts.
- Users can read only their own accounts and transaction history.
- Users can deposit into and withdraw from only their own accounts.
- A transfer source must belong to the authenticated user.
- A transfer destination may belong to another user, but it must exist.
- Users can update or delete only themselves.

Requests for another user's owned account return `403 Forbidden`.

## Integer cents

Money is never stored as a floating-point dollar value.

```json
{
  "amountCents": 12550
}
```

represents `$125.50`.

Operation requests currently use `amountCents`. Account and transaction
responses use `balance_cents` and `amount_cents`.

Integer cents avoid floating-point results such as
`0.1 + 0.2 !== 0.3`.

## Idempotency

Deposits, withdrawals, and transfers require:

```http
Idempotency-Key: 6748302e-08c5-4ce9-966a-bef8479aec15
```

The key must contain between 8 and 128 characters. A UUID is a convenient
choice.

### Why it exists

A client may send a deposit successfully but lose the response because of a
network interruption. Retrying the same deposit without protection could apply
it twice.

For each initiating money operation:

1. The controller requires the header.
2. The service validates its length.
3. The key is stored on the initiating transaction record.
4. MongoDB enforces a unique partial index on `idempotency_key`.
5. Reusing the key causes the MongoDB transaction to roll back.
6. The API returns `409 Conflict` instead of changing the balance again.

The index is partial so transfer counterpart entries, which do not carry an
idempotency key, can coexist.

An actual retry must reuse the original key. A new logical operation must use a
new key. Keys are unique across all money operations, not just within one
account.

## Atomic money operations

Money operations use MongoDB sessions and transactions:

### Deposit

- Verify the account is owned.
- Increment `balance_cents`.
- Insert the `DEPOSIT` ledger entry.
- Commit both changes together.

### Withdrawal

- Verify the account is owned.
- Atomically update only when `balance_cents >= amountCents`.
- Insert the `WITHDRAWAL` ledger entry.
- Commit both changes together.

The conditional `$inc` prevents two concurrent withdrawals from both approving
against the same earlier balance.

### Transfer

- Verify the source is owned.
- Verify the destination exists.
- Conditionally debit the source.
- Credit the destination.
- Insert `TRANSFER_OUT` and `TRANSFER_IN` entries.
- Commit all four writes together.

If any step fails, MongoDB aborts the entire operation.

## Hard deletion

`DELETE` physically removes documents, matching the lifecycle behavior on
`main`.

An account can be deleted only when its balance is zero. The account and all of
its transaction records are deleted together in one MongoDB transaction.

Deleting a user requires every owned account to have a zero balance. The
service deletes the user's transaction history, accounts, and user document in
one MongoDB transaction. Existing JWTs stop working because authentication can
no longer load the deleted user.

An individual transaction can be deleted only through an account owned by the
authenticated user.

## API routes

Public routes:

| Method | Route | Description |
|---|---|---|
| GET | `/` | API status |
| GET | `/health` | Application and database readiness |
| GET | `/health/live` | Process liveness |
| POST | `/api/auth/register` | Register and receive a JWT |
| POST | `/api/auth/login` | Log in and receive a JWT |

Protected user routes:

| Method | Route | Description |
|---|---|---|
| GET | `/api/users/me` | Get the authenticated user |
| PATCH | `/api/users/me` | Update the authenticated user |
| DELETE | `/api/users/me` | Delete the user, zero-balance accounts, and transaction history |

Protected account routes:

| Method | Route | Description |
|---|---|---|
| GET | `/api/accounts` | List the authenticated user's accounts |
| POST | `/api/accounts` | Create an account for the authenticated user |
| GET | `/api/accounts/:id` | Get an owned account |
| POST | `/api/accounts/:id/deposit` | Deposit into an owned account |
| POST | `/api/accounts/:id/withdraw` | Withdraw from an owned account |
| POST | `/api/accounts/:id/transfer` | Transfer from an owned account |
| GET | `/api/accounts/:id/transactions` | Get transaction history |
| DELETE | `/api/accounts/:id/transactions/:txnId` | Delete an owned account transaction |
| DELETE | `/api/accounts/:id` | Delete a zero-balance account and its transaction history |

## Example review flow

1. Register user A and copy the returned token.
2. Create a checking account with user A's token.
3. Deposit `10000` cents using an idempotency key.
4. Repeat the same deposit with the same key and confirm the API returns `409`.
5. Register user B and create an account with user B's token.
6. Transfer from user A's account to user B's account using a new key.
7. Load both transaction histories and verify the paired transfer entries.
8. Attempt to read user B's account with user A's token and confirm `403`.
9. Attempt two withdrawals whose combined value exceeds the source balance.
10. Delete one transaction and confirm it is removed from the account history.
11. Empty an account, delete it, and confirm the account no longer exists.

## Swagger

With the API running, open:

```text
http://localhost:3000/api-docs
```

To test protected endpoints:

1. Run `POST /api/auth/register` or `POST /api/auth/login`.
2. Copy the returned token.
3. Select **Authorize**.
4. Paste the token into the bearer field.

The OpenAPI 3.1 document is available at:

```text
http://localhost:3000/openapi.json
```

## Database initialization and indexes

At startup this branch:

1. Connects to the configured database.
2. Creates the current indexes below.
3. Pings MongoDB before starting Express.

The application assumes an empty database and does not migrate legacy money
fields, numeric IDs, references, indexes, or counter collections.

Indexes:

| Collection | Index | Purpose |
|---|---|---|
| `users` | unique `email` | Prevent duplicate normalized emails |
| `accounts` | `user_id` | List accounts by owner |
| `transactions` | `account_id`, `created_at DESC` | Load account history newest-first |
| `transactions` | unique partial `idempotency_key` | Reject duplicate money operations |

Review against the separate empty database recommended above so every document
uses this branch's ObjectId schema.

The server closes its MongoDB connection on `SIGINT` and `SIGTERM`.

## Frontend behavior

The React client:

- Registers and logs in through `/api/auth`.
- Stores the JWT in browser local storage.
- Restores the current user through `/api/users/me`.
- Adds the bearer token to protected requests.
- Clears the token when the API returns `401`.
- Uses ObjectId strings throughout its account state.
- Generates idempotency keys for deposits, withdrawals, and transfers.
- Displays balances by converting integer cents to dollars.

## Reviewer checklist

- [ ] Registration hashes the password and never returns `hash_password`.
- [ ] Stored emails are trimmed and lowercase.
- [ ] Duplicate normalized emails are rejected.
- [ ] Invalid, expired, or malformed JWTs return `401`.
- [ ] Deleted users cannot use an existing token.
- [ ] Account ownership violations return `403`.
- [ ] Invalid ObjectId strings return `400`.
- [ ] Money amounts must be positive safe integers.
- [ ] Duplicate idempotency keys return `409` without another balance change.
- [ ] Concurrent withdrawals cannot overdraw an account.
- [ ] Transfers update both balances and both ledger entries atomically.
- [ ] Transaction deletion requires ownership of the containing account.
- [ ] Account deletion removes its transaction history.
- [ ] User deletion removes zero-balance accounts and their transaction history.
- [ ] Swagger can authorize and call protected endpoints.
