import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ManageAccountsRoundedIcon from '@mui/icons-material/ManageAccountsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import * as api from './api';
import type { Account, PublicUser, Transaction } from './api';
import LoadingState from './components/LoadingState';
import TransactionTable from './components/TransactionTable';
import { formatDateTime } from './utils/date';
import { formatCurrency } from './utils/money';

interface AdminProps {
  currentUserId: string;
}

interface SummaryCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function SummaryCard({ icon, label, value }: SummaryCardProps) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 3,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            mb: 2,
          }}
        >
          {icon}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function Admin({ currentUserId }: AdminProps) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [transactionsError, setTransactionsError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const administratorCount = users.filter((user) => user.role === 'admin').length;
  const totalBalanceCents = useMemo(
    () => accounts.reduce((total, account) => total + account.balance_cents, 0),
    [accounts],
  );
  const selectedAccount =
    accounts.find((account) => account.account_id === selectedAccountId) ?? null;

  useEffect(() => {
    void loadAll();
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

  async function changeRole(user: PublicUser) {
    const key = `role:${user.user_id}`;
    setActionKey(key);
    setError('');

    try {
      const updated = await api.adminSetUserRole(
        user.user_id,
        user.role === 'admin' ? 'user' : 'admin',
      );
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.user_id === updated.user_id ? updated : currentUser,
        ),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionKey(null);
    }
  }

  function requestDelete(user: PublicUser) {
    setDeleteCandidate(user);
    setDeleteError('');
  }

  function closeDeleteDialog() {
    if (actionKey?.startsWith('delete:')) {
      return;
    }

    setDeleteCandidate(null);
    setDeleteError('');
  }

  async function confirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    const candidate = deleteCandidate;
    const key = `delete:${candidate.user_id}`;
    setActionKey(key);
    setDeleteError('');

    try {
      await api.adminDeleteUser(candidate.user_id);

      const removedAccountIds = new Set(
        accounts
          .filter((account) => account.user_id === candidate.user_id)
          .map((account) => account.account_id),
      );

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user.user_id !== candidate.user_id),
      );
      setAccounts((currentAccounts) =>
        currentAccounts.filter((account) => account.user_id !== candidate.user_id),
      );

      if (selectedAccountId && removedAccountIds.has(selectedAccountId)) {
        setSelectedAccountId(null);
        setTransactions([]);
        setTransactionsError('');
      }

      setDeleteCandidate(null);
    } catch (err) {
      setDeleteError((err as Error).message);
    } finally {
      setActionKey(null);
    }
  }

  async function viewTransactions(accountId: string) {
    setSelectedAccountId(accountId);
    setTransactions([]);
    setTransactionsLoading(true);
    setTransactionsError('');

    try {
      setTransactions(await api.adminGetAccountTransactions(accountId));
    } catch (err) {
      setTransactionsError((err as Error).message);
    } finally {
      setTransactionsLoading(false);
    }
  }

  function closeTransactions() {
    setSelectedAccountId(null);
    setTransactions([]);
    setTransactionsError('');
  }

  if (loading) {
    return <LoadingState message="Loading admin data…" />;
  }

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void loadAll()}>
              Refresh
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        <SummaryCard
          icon={<PeopleRoundedIcon />}
          label="Users"
          value={String(users.length)}
        />
        <SummaryCard
          icon={<AccountBalanceWalletRoundedIcon />}
          label="Accounts"
          value={String(accounts.length)}
        />
        <SummaryCard
          icon={<AdminPanelSettingsRoundedIcon />}
          label="Administrators"
          value={String(administratorCount)}
        />
        <SummaryCard
          icon={<ManageAccountsRoundedIcon />}
          label="Combined balance"
          value={formatCurrency(totalBalanceCents)}
        />
      </Box>

      <Card>
        <CardContent
          sx={{
            p: { xs: 3, sm: 4 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 750 }}>
              Users
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Manage access roles or remove eligible users.
            </Typography>
          </Box>
          <Chip label={`${users.length} users`} variant="outlined" />
        </CardContent>
        <Divider />

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 900 }} aria-label="Admin users">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No users found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const isSelf = user.user_id === currentUserId;
                  const roleActionKey = `role:${user.user_id}`;
                  const roleBusy = actionKey === roleActionKey;
                  const anotherActionBusy = actionKey !== null && !roleBusy;

                  return (
                    <TableRow key={user.user_id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 750 }}>{user.name}</Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: 'monospace' }}
                            >
                              {user.user_id}
                            </Typography>
                          </Box>
                          {isSelf && <Chip label="You" size="small" variant="outlined" />}
                        </Stack>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role === 'admin' ? 'Administrator' : 'User'}
                          color={user.role === 'admin' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatDateTime(user.created_at)}
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ minWidth: 230, justifyContent: 'flex-end' }}
                        >
                          <Tooltip
                            title={
                              isSelf && user.role === 'admin'
                                ? 'You cannot revoke your own administrator role.'
                                : ''
                            }
                          >
                            <span>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={
                                  roleBusy ? (
                                    <CircularProgress size={16} color="inherit" />
                                  ) : (
                                    <AdminPanelSettingsRoundedIcon />
                                  )
                                }
                                disabled={
                                  anotherActionBusy ||
                                  roleBusy ||
                                  (isSelf && user.role === 'admin')
                                }
                                onClick={() => void changeRole(user)}
                              >
                                {user.role === 'admin' ? 'Demote' : 'Promote'}
                              </Button>
                            </span>
                          </Tooltip>

                          <Tooltip
                            title={isSelf ? 'You cannot delete your own user.' : ''}
                          >
                            <span>
                              <Button
                                size="small"
                                color="error"
                                startIcon={<DeleteOutlineRoundedIcon />}
                                disabled={isSelf || actionKey !== null}
                                onClick={() => requestDelete(user)}
                              >
                                Delete
                              </Button>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Card>
        <CardContent
          sx={{
            p: { xs: 3, sm: 4 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 750 }}>
              Accounts
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Review ownership, balances, and ledger history.
            </Typography>
          </Box>
          <Chip label={`${accounts.length} accounts`} variant="outlined" />
        </CardContent>
        <Divider />

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 960 }} aria-label="Admin accounts">
            <TableHead>
              <TableRow>
                <TableCell>Account ID</TableCell>
                <TableCell>Owner ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Balance</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">No accounts found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => {
                  const viewing =
                    selectedAccountId === account.account_id && transactionsLoading;

                  return (
                    <TableRow key={account.account_id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {account.account_id}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {account.user_id}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={account.account_type}
                          color={
                            account.account_type === 'SAVINGS' ? 'secondary' : 'primary'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 750 }}>
                        {formatCurrency(account.balance_cents)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatDateTime(account.created_at)}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={
                            viewing ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <ReceiptLongRoundedIcon />
                            )
                          }
                          disabled={transactionsLoading}
                          onClick={() => void viewTransactions(account.account_id)}
                        >
                          View transactions
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {selectedAccountId && (
        <Card>
          <CardContent
            sx={{
              p: { xs: 3, sm: 4 },
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 2,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 750 }}>
                Account transactions
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>
                {selectedAccount
                  ? `${selectedAccount.account_type} · #${selectedAccount.account_id}`
                  : `#${selectedAccountId}`}
              </Typography>
            </Box>
            <IconButton
              aria-label="Close transaction history"
              onClick={closeTransactions}
              disabled={transactionsLoading}
            >
              <CloseRoundedIcon />
            </IconButton>
          </CardContent>
          <Divider />

          {transactionsLoading ? (
            <Box
              role="status"
              aria-live="polite"
              sx={{ py: 6, px: 3, display: 'grid', justifyItems: 'center', gap: 1.5 }}
            >
              <CircularProgress aria-hidden="true" />
              <Typography color="text.secondary">
                Loading account transactions…
              </Typography>
            </Box>
          ) : transactionsError ? (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">{transactionsError}</Alert>
            </Box>
          ) : transactions.length === 0 ? (
            <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
              <ReceiptLongRoundedIcon color="disabled" sx={{ fontSize: 46 }} />
              <Typography variant="h5" sx={{ fontWeight: 750, mt: 1 }}>
                No transactions yet
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                This account does not have any ledger entries.
              </Typography>
            </Box>
          ) : (
            <TransactionTable
              transactions={transactions}
              ariaLabel={`Transactions for account ${selectedAccountId}`}
            />
          )}
        </Card>
      )}

      <Dialog
        open={deleteCandidate !== null}
        onClose={closeDeleteDialog}
        aria-labelledby="delete-user-title"
      >
        <DialogTitle id="delete-user-title">Delete user?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteCandidate
              ? `This permanently removes ${deleteCandidate.name} and any eligible zero-balance accounts and transaction history.`
              : ''}
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeDeleteDialog}
            disabled={Boolean(actionKey?.startsWith('delete:'))}
          >
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => void confirmDelete()}
            disabled={Boolean(actionKey?.startsWith('delete:'))}
            startIcon={
              actionKey?.startsWith('delete:') ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <DeleteOutlineRoundedIcon />
              )
            }
          >
            {actionKey?.startsWith('delete:') ? 'Deleting…' : 'Delete user'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
