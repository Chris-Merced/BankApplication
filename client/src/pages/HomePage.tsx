import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import AddCardRoundedIcon from '@mui/icons-material/AddCardRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Pagination,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Account, PublicUser } from '../api';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatCurrency } from '../utils/money';
import { maskAccountId } from '../utils/objectId';

interface HomePageProps {
  user: PublicUser;
  accounts: Account[];
  loading: boolean;
  error: string;
  onLogout: () => void;
  onRefreshAccounts: () => Promise<void>;
}

const ACCOUNT_PAGE_SIZE = 6;

export default function HomePage({
  user,
  accounts,
  loading,
  error,
  onLogout,
  onRefreshAccounts,
}: HomePageProps) {
  useDocumentTitle('Home');

  const navigate = useNavigate();
  const [accountPage, setAccountPage] = useState(1);
  const hasAccounts = accounts.length > 0;
  const totalAccountPages = Math.max(1, Math.ceil(accounts.length / ACCOUNT_PAGE_SIZE));
  const visibleAccounts = accounts.slice(
    (accountPage - 1) * ACCOUNT_PAGE_SIZE,
    accountPage * ACCOUNT_PAGE_SIZE,
  );

  useEffect(() => {
    setAccountPage((currentPage) => Math.min(currentPage, totalAccountPages));
  }, [totalAccountPages]);

  useEffect(() => {
    void onRefreshAccounts();
  }, [onRefreshAccounts]);

  function logout() {
    onLogout();
    navigate('/auth', { replace: true });
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader user={user} onLogout={logout} />

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card
          sx={{
            mb: 4,
            overflow: 'hidden',
            color: 'common.white',
            background:
              'linear-gradient(120deg, #073b91 0%, #0b57d0 55%, #2271df 100%)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
            <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: '0.12em' }}>
              Account overview
            </Typography>
            <Typography variant="h1" component="h1" sx={{ mt: 0.5, mb: 1 }}>
              Welcome, {user.name.split(' ')[0]}.
            </Typography>
            <Typography sx={{ maxWidth: 620, opacity: 0.86, fontSize: '1.05rem' }}>
              Open a new account or choose an existing one to manage your balance and
              transactions.
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="h2" component="h2" sx={{ mb: 2 }}>
          What would you like to do?
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
            gap: 2.5,
            mb: 5,
          }}
        >
          <Card>
            <CardContent sx={{ p: 3 }}>
              <AddCardRoundedIcon color="primary" sx={{ fontSize: 34, mb: 1.5 }} />
              <Typography variant="h5" component="h3" sx={{ fontWeight: 750 }}>
                Create Account
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                Open a checking or savings account linked to your profile.
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 3, pb: 3 }}>
              <Button
                component={Link}
                to="/accounts/new"
                variant="contained"
                endIcon={<ArrowForwardRoundedIcon />}
              >
                Create Account
              </Button>
            </CardActions>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <VisibilityRoundedIcon color="secondary" sx={{ fontSize: 34, mb: 1.5 }} />
              <Typography variant="h5" component="h3" sx={{ fontWeight: 750 }}>
                Search Accounts
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                {accounts.length > 0
                  ? `Review your ${accounts.length === 1 ? 'account' : `${accounts.length} accounts`} and recent activity.`
                  : 'Search your existing accounts with filter options.'}
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 3, pb: 3 }}>
              <Button
                component={Link}
                to="/accounts/search"
                variant="outlined"
                color="secondary"
                endIcon={<ArrowForwardRoundedIcon />}
              >
                Search Accounts
              </Button>
            </CardActions>
          </Card>

          <Card>
            <CardContent sx={{ p: 3 }}>
              <SwapHorizRoundedIcon color="primary" sx={{ fontSize: 34, mb: 1.5 }} />
              <Typography variant="h5" component="h3" sx={{ fontWeight: 750 }}>
                Transfer/Send
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                {hasAccounts
                  ? 'Move money between your accounts, or send it to someone else.'
                  : 'Open an account first — you need somewhere to move money from.'}
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 3, pb: 3 }}>
              <Button
                component={Link}
                to={hasAccounts ? '/transfer' : '/accounts/new'}
                variant="outlined"
                endIcon={<ArrowForwardRoundedIcon />}
              >
                {hasAccounts ? 'Transfer' : 'Get Started'}
              </Button>
            </CardActions>
          </Card>
        </Box>

        <Box id="accounts">
          <PageHeader
            title="Your accounts"
            component="h2"
            action={!loading ? (
            <Chip
              label={`${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'}`}
              variant="outlined"
            />
            ) : undefined}
          />
        </Box>

        {loading ? (
          <LoadingState message="Loading your accounts…" />
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={
              <AccountBalanceWalletRoundedIcon
                color="disabled"
                sx={{ fontSize: 46 }}
              />
            }
            title="No accounts yet"
            description="Open your first checking or savings account to get started."
            action={
              <Button component={Link} to="/accounts/new" variant="contained">
                Create Account
              </Button>
            }
          />
        ) : (
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(3, minmax(0, 1fr))',
                },
                gap: 2.5,
              }}
            >
              {visibleAccounts.map((account) => (
              <Card key={account.account_id}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <Chip
                      label={account.account_type}
                      color={account.account_type === 'SAVINGS' ? 'secondary' : 'primary'}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      #{maskAccountId(account.account_id)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Available balance
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {formatCurrency(account.balance_cents)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 3, pb: 3 }}>
                  <Button
                    component={Link}
                    to={`/accounts/${account.account_id}`}
                    endIcon={<ArrowForwardRoundedIcon />}
                  >
                    View details
                  </Button>
                </CardActions>
              </Card>
              ))}
            </Box>

            {accounts.length > ACCOUNT_PAGE_SIZE && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={totalAccountPages}
                  page={accountPage}
                  onChange={(_event, page) => setAccountPage(page)}
                  color="primary"
                />
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}
