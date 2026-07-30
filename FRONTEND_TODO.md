# Frontend TODO

> **Temporary branch document:** This checklist tracks the MUI work on the
> `frontend` branch. It is not permanent project documentation. Remove this file
> and its README reference when the plan is complete; move any unfinished work
> to the team's permanent task tracker before merging.

## Foundation

- [x] Add Material UI, Emotion, Material Icons, and React Router.
- [x] Add a shared MUI theme and `CssBaseline`.
- [x] Add public and protected routes.
- [x] Add a shared authenticated application header.
- [x] Add shared loading, empty, and page-header components.

## Pages

### 7.0 Authentication — `/auth`

- [x] Support login and user registration in one card.
- [x] Keep user registration visually distinct from opening a bank account.
- [x] Display validation and API errors.
- [x] Disable the form and show progress while submitting.
- [x] Redirect successful authentication to Home.

### 7.1 Home — `/`

- [x] Show the signed-in user's name.
- [x] Provide Create Account and View Account actions.
- [x] Show responsive account summary cards.
- [x] Handle users with zero, one, or multiple accounts.
- [x] Provide logout from the application header.

### 7.2 Create Account — `/accounts/new`

- [x] Display the signed-in user's name and email as read-only fields.
- [x] Provide a checking/savings account-type dropdown.
- [x] Create the account through the existing API.
- [x] Navigate to Account Details after success.

### 7.3 Account Details — `/accounts/:accountId`

- [ ] Display account ID, user name, account type, balance, and creation date.
- [ ] Provide Deposit, Withdraw, and View Transactions actions.
- [ ] Provide navigation back to Home.

### 7.4 Deposit — `/accounts/:accountId/deposit`

- [ ] Show the selected account and current balance.
- [ ] Accept a positive dollar amount and convert it to cents.
- [ ] Show the projected balance.
- [ ] Submit through the deposit API and return to Account Details.

### 7.5 Withdraw — `/accounts/:accountId/withdraw`

- [ ] Show the selected account and available balance.
- [ ] Accept a positive dollar amount and convert it to cents.
- [ ] Warn when the amount exceeds the displayed balance.
- [ ] Submit through the withdrawal API and return to Account Details.

### 7.6 Transaction History — `/accounts/:accountId/transactions`

- [ ] Display transaction ID, type, amount, and date in a responsive table.
- [ ] Use distinct deposit and withdrawal chips and signed currency amounts.
- [ ] Add loading, error, and empty states.
- [ ] Provide navigation back to Account Details.

## Shared UX

- [ ] Use cards as the primary content surface on every page.
- [ ] Add breadcrumbs or a clear back action to nested pages.
- [ ] Keep currency and date formatting consistent.
- [ ] Ensure forms have labels, validation, loading states, and accessible errors.
- [ ] Verify keyboard navigation and responsive layouts.
- [ ] Replace the temporary route placeholders as each remaining page is built.

## Verification

- [ ] Verify registration and login.
- [ ] Verify protected-route redirects and logout.
- [ ] Verify zero-, one-, and multiple-account Home states.
- [ ] Verify account creation, deposits, withdrawals, and transaction history.
- [ ] Run the API and client production builds.
- [ ] Perform a final desktop and mobile-width UI review.
- [ ] Remove this temporary file and its README reference when the plan is complete.
