import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import AddCardRoundedIcon from '@mui/icons-material/AddCardRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
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
  Typography,
} from '@mui/material';
import { Link, useNavigate } from 'react-router';
import type { Account, PublicUser } from '../api';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';

interface HomePageProps {
  user: PublicUser;
  accounts: Account[];
  loading: boolean;
  error: string;
  onLogout: () => void;
}

function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountCents / 100);
}

function maskAccountId(accountId: number): string {
  const digits = String(accountId);

  if (digits.length <= 2) {
    return digits;
  }

  const visibleDigits = Math.ceil(digits.length / 2);
  return `${digits.slice(0, visibleDigits)}${'•'.repeat(digits.length - visibleDigits)}`;
}

export default function HomePage({
  user,
  accounts,
  loading,
  error,
  onLogout,
}: HomePageProps) {
  useDocumentTitle('Home');

  const navigate = useNavigate();
  const firstAccount = accounts[0];
  const viewAccountTarget = firstAccount
    ? `/accounts/${firstAccount.account_id}`
    : '/accounts/new';

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
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
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
                View Account
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                {accounts.length > 0
                  ? `Review your ${accounts.length === 1 ? 'account' : `${accounts.length} accounts`} and recent activity.`
                  : 'Create your first account to begin managing a balance.'}
              </Typography>
            </CardContent>
            <CardActions sx={{ px: 3, pb: 3 }}>
              <Button
                component={Link}
                to={viewAccountTarget}
                variant="outlined"
                color="secondary"
                endIcon={<ArrowForwardRoundedIcon />}
              >
                {accounts.length > 0 ? 'View Account' : 'Get Started'}
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
            {accounts.map((account) => (
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
        )}
      </Container>
    </Box>
  );
}
