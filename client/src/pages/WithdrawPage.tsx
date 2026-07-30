import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import * as api from '../api';
import type { Account, PublicUser } from '../api';
import AppHeader from '../components/AppHeader';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatCurrency, parseDollarsToCents } from '../utils/money';
import { isObjectId } from '../utils/objectId';

interface WithdrawPageProps {
  user: PublicUser;
  onLogout: () => void;
  onAccountUpdated: (account: Account) => void;
}

export default function WithdrawPage({
  user,
  onLogout,
  onAccountUpdated,
}: WithdrawPageProps) {
  const { accountId } = useParams();
  const navigate = useNavigate();

  useDocumentTitle('Withdraw');

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');

  const amountCents = parseDollarsToCents(amount);
  const invalidAmount = amount.trim() !== '' && amountCents === null;
  const exceedsBalance =
    account !== null &&
    amountCents !== null &&
    amountCents > account.balance_cents;
  const projectedBalanceCents = useMemo(() => {
    if (!account || amountCents === null || exceedsBalance) {
      return null;
    }

    return account.balance_cents - amountCents;
  }, [account, amountCents, exceedsBalance]);

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      if (!isObjectId(accountId)) {
        setError('Invalid account ID.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const loadedAccount = await api.getAccount(accountId);

        if (active) {
          setAccount(loadedAccount);
        }
      } catch (err) {
        if (active) {
          setAccount(null);
          setError((err as Error).message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAccount();

    return () => {
      active = false;
    };
  }, [accountId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!account) {
      return;
    }

    if (amountCents === null) {
      setError('Enter a positive dollar amount with no more than two decimal places.');
      return;
    }

    if (amountCents > account.balance_cents) {
      setError('The withdrawal amount exceeds the available balance.');
      return;
    }

    setSubmitting(true);

    try {
      const updatedAccount = await api.withdraw(account.account_id, amountCents);
      onAccountUpdated(updatedAccount);
      navigate(`/accounts/${updatedAccount.account_id}`, { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader user={user} onLogout={onLogout} />

      <Container component="main" maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <PageHeader
          title="Withdraw"
          description="Review the available balance before withdrawing funds."
          backTo={account ? `/accounts/${account.account_id}` : '/'}
        />

        {loading ? (
          <LoadingState message="Loading account for withdrawal…" />
        ) : error && !account ? (
          <Alert severity="error">{error}</Alert>
        ) : account ? (
          <Box sx={{ display: 'grid', gap: 2.5 }}>
            <Card>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 3,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                    }}
                  >
                    <AccountBalanceRoundedIcon />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 750 }}>
                      Selected account
                    </Typography>
                    <Typography color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                      #{account.account_id} · {account.account_type}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Available balance
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                      {formatCurrency(account.balance_cents)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Projected balance
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                      {projectedBalanceCents === null
                        ? '—'
                        : formatCurrency(projectedBalanceCents)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 750, mb: 0.75 }}>
                  Withdraw funds
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Enter a positive dollar amount that does not exceed the available balance.
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                {exceedsBalance && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    This amount is greater than the available balance of{' '}
                    {formatCurrency(account.balance_cents)}.
                  </Alert>
                )}

                <Box component="form" onSubmit={submit} noValidate>
                  <Box sx={{ display: 'grid', gap: 2.5 }}>
                    <TextField
                      label="Withdrawal amount"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      disabled={submitting}
                      required
                      error={invalidAmount || exceedsBalance}
                      helperText={
                        invalidAmount
                          ? 'Enter a positive amount with no more than two decimal places.'
                          : exceedsBalance
                            ? 'Insufficient funds for this withdrawal.'
                            : 'Use dollars and cents, for example 25.00.'
                      }
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        },
                        htmlInput: {
                          inputMode: 'decimal',
                          placeholder: '0.00',
                        },
                      }}
                    />

                    <Divider />

                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 2,
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <AccountBalanceWalletRoundedIcon color="primary" />
                        <Typography color="text.secondary">
                          The server verifies the balance again before posting.
                        </Typography>
                      </Box>

                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={submitting || amountCents === null || exceedsBalance}
                        startIcon={
                          submitting ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <TrendingDownRoundedIcon />
                          )
                        }
                        sx={{ ml: 'auto' }}
                      >
                        {submitting ? 'Withdrawing…' : 'Withdraw'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ) : null}
      </Container>
    </Box>
  );
}
