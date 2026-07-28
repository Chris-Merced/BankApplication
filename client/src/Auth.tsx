import { useState } from 'react';
import * as api from './api';
import type { PublicUser } from './api';

interface AuthProps {
  onAuthenticated: (user: PublicUser) => void;
}

/**
 * Login / register gate. Registering signs the new user straight in, since
 * the create call returns the same PublicUser shape that login does.
 */
export default function Auth({ onAuthenticated }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  // Prevents a stale error from a previous attempt hanging around after switching modes
  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setError('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = isRegister
        ? await api.register(name, email, password)
        : await api.login(email, password);
      setPassword(''); // don't leave the plaintext password sitting in state
      onAuthenticated(user);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20, maxWidth: 360 }}>
      <h1>Bank Application</h1>
      <h2>{isRegister ? 'Create Account' : 'Log In'}</h2>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isRegister && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoComplete="name"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
        />
        {isRegister && <small>Password must be at least 8 characters.</small>}
        <button type="submit" disabled={busy}>
          {busy ? 'Working…' : isRegister ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      <p>
        {isRegister ? 'Already have an account?' : 'No account yet?'}{' '}
        <button type="button" onClick={switchMode} style={{ cursor: 'pointer' }}>
          {isRegister ? 'Log in' : 'Sign up'}
        </button>
      </p>
    </div>
  );
}
