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
- [x] Provide Create Account and Search Account actions.
- [x] Show responsive account summary cards.
- [x] Handle users with zero, one, or multiple accounts.
- [x] Provide logout from the application header.

### 7.2 Create Account — `/accounts/new`

- [x] Display the signed-in user's name and email as read-only fields.
- [x] Provide a checking/savings account-type dropdown.
- [x] Create the account through the existing API.
- [x] Navigate to Account Details after success.

### 7.3 Account Details — `/accounts/:accountId`

- [x] Display of account ID, user name, account type, balance, and creation date.
- [x] Provide Deposit, Withdraw, and View Transactions actions.
- [x] Provide navigation back to Home.
- [x] Provide button to copy account ID to clipboard


### 7.4 Deposit — `/accounts/:accountId/deposit`

- [x] Show the selected account and current balance.
- [x] Accept a positive dollar amount and convert it to cents.
- [x] Show the projected balance.
- [x] Submit through the deposit API and return to Account Details.

### 7.5 Withdraw — `/accounts/:accountId/withdraw`

- [x] Show the selected account and available balance.
- [x] Accept a positive dollar amount and convert it to cents.
- [x] Warn when the amount exceeds the displayed balance.
- [x] Submit through the withdrawal API and return to Account Details.

### 7.6 Transaction History — `/accounts/:accountId/transactions`

- [x] Display transaction ID, type, amount, and date in a responsive table.
- [x] Use distinct deposit and withdrawal chips and signed currency amounts.
- [x] Add loading, error, and empty states.
- [x] Provide navigation back to Account Details.

### 7.7 Search Accounts — `/accounts/search`

- [x] Add a search bar for looking up a specific account ID.
- [x] Add checkboxes to filter by account type: Checking and Savings.
- [x] Add a sort dropdown with Transaction Count, Transactions Amount, Gross, Date Created, and Date Updated.
- [x] Add ascending and descending sort direction control.
- [x] Add pagination for large search result sets.

### 7.8 Admin — `/admin`

- [x] Restrict the route and navigation link to authenticated admin users.
- [x] Use the shared application header, page header, and responsive container.
- [x] Replace raw HTML tables, buttons, paragraphs, and inline styles with MUI components.
- [x] Add summary cards for user, account, administrator, and total-balance counts.
- [x] Present users in a responsive Card and Table with role Chips and formatted dates.
- [x] Use MUI actions for promoting, demoting, and deleting users with per-action progress states.
- [x] Preserve self-protection rules and explain disabled self-actions with accessible helper text.
- [x] Require confirmation before deleting another user and surface API failures without losing table state.
- [x] Present accounts in a responsive Card and Table with formatted balances, dates, and ObjectIds.
- [x] Show a selected account's read-only transaction history using the same type Chips, signed amounts, and date formatting as 7.6.
- [x] Add loading, error, and empty states for users, accounts, and selected transaction history.
- [ ] Verify tables scroll at mobile widths and action controls remain keyboard accessible.

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
- [ ] Verify non-admin redirection and admin-only navigation.
- [ ] Verify admin role changes, self-protection, deletion confirmation, and account history.
- [ ] Verify zero-, one-, and multiple-account Home states.
- [ ] Verify account creation, deposits, withdrawals, and transaction history.
- [x] Run the API and client production builds.
- [ ] Perform a final desktop and mobile-width UI review.
- [ ] Remove this temporary file and its README reference when the plan is complete.
