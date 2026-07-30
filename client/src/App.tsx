import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { useState } from 'react';
import * as api from './api';
import type { Account, PublicUser } from './api';
import AuthPage from './pages/AuthPage';
import CreateAccountPage from './pages/CreateAccountPage';
import AccountDetailsPage from './pages/AccountDetailsPage';
import DepositPage from './pages/DepositPage';
import HomePage from './pages/HomePage';
import PlannedPage from './pages/PlannedPage';

export default function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAuthenticated(user: PublicUser): Promise<void> {
    setCurrentUser(user);
    setAccountsLoading(true);
    setError('');

    try {
      setAccounts(await api.getAccountsForUser(user.user_id));
    } catch (err) {
      setAccounts([]);
      setError((err as Error).message);
    } finally {
      setAccountsLoading(false);
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    setAccounts([]);
    setError('');
  }

  function logoutAndNavigate() {
    handleLogout();
    navigate('/auth', { replace: true });
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
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/accounts/new"
        element={
          <CreateAccountPage
            user={currentUser}
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
          />
        }
      />
      <Route
        path="/accounts/:accountId/withdraw"
        element={
          <PlannedPage
            user={currentUser}
            title="Withdraw"
            onLogout={logoutAndNavigate}
          />
        }
      />
      <Route
        path="/accounts/:accountId/transactions"
        element={
          <PlannedPage
            user={currentUser}
            title="Transactions"
            onLogout={logoutAndNavigate}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
