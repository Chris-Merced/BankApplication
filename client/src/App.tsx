import { Box, Container } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import * as api from './api';
import type { Account, PublicUser } from './api';
import LoadingState from './components/LoadingState';
import AccountDetailsPage from './pages/AccountDetailsPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import CreateAccountPage from './pages/CreateAccountPage';
import DepositPage from './pages/DepositPage';
import HomePage from './pages/HomePage';
import SearchAccountsPage from './pages/SearchAccountsPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import TransferPage from './pages/TransferPage';
import WithdrawPage from './pages/WithdrawPage';

export default function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [restoringSession, setRestoringSession] = useState(api.hasToken());
  const [error, setError] = useState('');

  useEffect(() => {
    function expireSession() {
      handleLogout();
    }

    window.addEventListener(api.AUTH_EXPIRED_EVENT, expireSession);

    if (api.hasToken()) {
      api
        .getCurrentUser()
        .then(handleAuthenticated)
        .catch(() => api.logout())
        .finally(() => setRestoringSession(false));
    }

    return () => {
      window.removeEventListener(api.AUTH_EXPIRED_EVENT, expireSession);
    };
  }, []);

  async function handleAuthenticated(user: PublicUser): Promise<void> {
    setCurrentUser(user);
    setAccountsLoading(true);
    setError('');

    try {
      setAccounts(await api.getAccounts());
    } catch (err) {
      setAccounts([]);
      setError((err as Error).message);
    } finally {
      setAccountsLoading(false);
    }
  }

  const refreshAccounts = useCallback(async (): Promise<void> => {
    try {
      setAccounts(await api.getAccounts());
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  function handleAccountCreated(account: Account) {
    setAccounts((currentAccounts) => [...currentAccounts, account]);
  }

  function handleAccountUpdated(account: Account) {
    setAccounts((currentAccounts) =>
      currentAccounts.map((currentAccount) =>
        currentAccount.account_id === account.account_id ? account : currentAccount,
      ),
    );
  }

  function handleLogout() {
    api.logout();
    setCurrentUser(null);
    setAccounts([]);
    setError('');
  }

  function logoutAndNavigate() {
    handleLogout();
    navigate('/auth', { replace: true });
  }

  if (restoringSession) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <LoadingState message="Restoring your session…" />
        </Container>
      </Box>
    );
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage onAuthenticated={handleAuthenticated} />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<Navigate to="/" replace />} />
      <Route
        path="/"
        element={
          <HomePage
            user={currentUser}
            accounts={accounts}
            loading={accountsLoading}
            error={error}
            onLogout={logoutAndNavigate}
            onRefreshAccounts={refreshAccounts}
          />
        }
      />
      <Route
        path="/admin"
        element={
          currentUser.role === 'admin' ? (
            <AdminPage user={currentUser} onLogout={logoutAndNavigate} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/accounts/new"
        element={
          <CreateAccountPage
            user={currentUser}
            onLogout={logoutAndNavigate}
            onAccountCreated={handleAccountCreated}
          />
        }
      />
      <Route
        path="/transfer"
        element={
          <TransferPage
            user={currentUser}
            accounts={accounts}
            onLogout={logoutAndNavigate}
            onTransferComplete={refreshAccounts}
          />
        }
      />
      <Route
        path="/accounts/search"
        element={
          <SearchAccountsPage
            user={currentUser}
            accounts={accounts}
            onLogout={logoutAndNavigate}
          />
        }
      />
      <Route
        path="/accounts/:accountId"
        element={
          <AccountDetailsPage
            user={currentUser}
            onLogout={logoutAndNavigate}
          />
        }
      />
      <Route
        path="/accounts/:accountId/deposit"
        element={
          <DepositPage
            user={currentUser}
            onLogout={logoutAndNavigate}
            onAccountUpdated={handleAccountUpdated}
          />
        }
      />
      <Route
        path="/accounts/:accountId/withdraw"
        element={
          <WithdrawPage
            user={currentUser}
            onLogout={logoutAndNavigate}
            onAccountUpdated={handleAccountUpdated}
          />
        }
      />
      <Route
        path="/accounts/:accountId/transactions"
        element={
          <TransactionHistoryPage
            user={currentUser}
            onLogout={logoutAndNavigate}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
