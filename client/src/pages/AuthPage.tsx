import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import * as api from '../api';
import type { PublicUser } from '../api';
import useDocumentTitle from '../hooks/useDocumentTitle';

interface AuthPageProps {
  onAuthenticated: (user: PublicUser) => Promise<void>;
}

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  useDocumentTitle('Sign In');

  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  function changeMode(nextMode: 'login' | 'register') {
    setMode(nextMode);
    setError('');
    setPassword('');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      const user = isRegister
        ? await api.register(name, email, password)
        : await api.login(email, password);
      setPassword('');
      await onAuthenticated(user);
      navigate('/', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 5,
        background:
          'radial-gradient(circle at 15% 10%, rgba(91, 141, 239, 0.24), transparent 30%), linear-gradient(145deg, #f7faff 0%, #edf3fc 100%)',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 460 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 54,
              height: 54,
              display: 'grid',
              placeItems: 'center',
              mx: 'auto',
              mb: 1.5,
              borderRadius: 3,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              boxShadow: '0 12px 30px rgba(11, 87, 208, 0.28)',
            }}
          >
            <AccountBalanceRoundedIcon fontSize="large" />
          </Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
            Simple Bank
          </Typography>
          <Typography color="text.secondary">
            Straightforward banking, all in one place.
          </Typography>
        </Box>

        <Card>
          <Tabs
            value={mode}
            onChange={(_event, value: 'login' | 'register') => changeMode(value)}
            variant="fullWidth"
            aria-label="Authentication options"
          >
            <Tab value="login" label="Log in" disabled={busy} />
            <Tab value="register" label="Create profile" disabled={busy} />
          </Tabs>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 750, mb: 0.75 }}>
              {isRegister ? 'Create your profile' : 'Welcome back'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {isRegister
                ? 'Register your user profile before opening a bank account.'
                : 'Enter your details to view and manage your accounts.'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={submit} noValidate>
              <Box sx={{ display: 'grid', gap: 2.25 }}>
                {isRegister && (
                  <TextField
                    label="Full name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    required
                    disabled={busy}
                  />
                )}
                <TextField
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  disabled={busy}
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                  disabled={busy}
                  slotProps={{
                    htmlInput: isRegister ? { minLength: 8 } : undefined,
                  }}
                  helperText={isRegister ? 'Use at least 8 characters.' : undefined}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={busy}
                  sx={{ mt: 0.5 }}
                >
                  {busy ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : isRegister ? (
                    'Create profile'
                  ) : (
                    'Log in'
                  )}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
