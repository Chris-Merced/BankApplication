import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type { Account, PublicUser, TransferRecipient } from '../api';
import * as api from '../api';
import AppHeader from '../components/AppHeader';
import PageHeader from '../components/PageHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatCurrency, parseDollarsToCents } from '../utils/money';

type TransferMode = 'internal' | 'external';

interface TransferPageProps {
  user: PublicUser;
  accounts: Account[];
  onLogout: () => void;
  onTransferComplete: () => Promise<void>;
}

/** "CHECKING #1748… · $1,284.53" — enough to tell two accounts apart in a dropdown. */
function describeAccount(account: Account): string {
  return `${account.account_type} #${account.account_id} · ${formatCurrency(account.balance_cents)}`;
}

export default function TransferPage({
  user,
  accounts,
  onLogout,
  onTransferComplete,
}: TransferPageProps) {
  useDocumentTitle('Transfer & Send');

  const [mode, setMode] = useState<TransferMode>('internal');
  const [fromId, setFromId] = useState<number | ''>(accounts[0]?.account_id ?? '');
  const [toId, setToId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  // Recipient lookup is a separate step from sending: the sender confirms who
  // they matched before any money moves.
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipient, setRecipient] = useState<TransferRecipient | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupBusy, setLookupBusy] = useState(false);

  const isExternal = mode === 'external';
  const fromAccount = accounts.find((account) => account.account_id === fromId) ?? null;
  const amountCents = parseDollarsToCents(amount);
  const overBalance =
    fromAccount !== null && amountCents !== null && amountCents > fromAccount.balance_cents;

  function changeMode(nextMode: TransferMode) {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setAmount('');
    setToId('');
    clearRecipient();
  }

  function clearRecipient() {
    setRecipient(null);
    setLookupError('');
  }

  async function lookupRecipient() {
    const trimmed = recipientQuery.trim();
    if (!/^\d+$/.test(trimmed)) {
      setLookupError('Enter an account ID — digits only.');
      return;
    }

    const accountId = Number(trimmed);
    if (accounts.some((account) => account.account_id === accountId)) {
      setLookupError('That is one of your own accounts. Use the Transfer tab instead.');
      return;
    }

    setLookupBusy(true);
    setLookupError('');
    setRecipient(null);
    setSuccess('');

    try {
      setRecipient(await api.lookupRecipient(accountId));
    } catch {
      // The service throws "Account not found"; say it in the sender's terms.
      setLookupError('No account matches that ID. Check the number and try again.');
    } finally {
      setLookupBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (fromId === '' || amountCents === null) {
      return;
    }

    const destinationId = isExternal ? recipient?.account_id : toId;
    if (destinationId === undefined || destinationId === '') {
      return;
    }

    setError('');
    setSuccess('');
    setBusy(true);

    try {
      const result = await api.transfer(fromId, destinationId, amountCents);
      setSuccess(
        `Sent ${formatCurrency(result.amount_cents)} to ${result.to.owner_name} (#${result.to.account_id}).`,
      );
      setAmount('');
      setToId('');
      setRecipientQuery('');
      clearRecipient();
      // Balances live in App, so the account dropdowns need the refreshed copy
      await onTransferComplete();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const recipientFirstName = recipient?.owner_name.split(' ')[0] ?? '';
  const canSubmit =
    !busy &&
    fromId !== '' &&
    amountCents !== null &&
    !overBalance &&
    (isExternal ? recipient !== null : toId !== '');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader user={user} onLogout={onLogout} />

      <Container component="main" maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
        <PageHeader
          title="Transfer & Send"
          description="Move money between your own accounts, or send it to someone else."
          backTo="/"
        />

        <Card>
          <Tabs
            value={mode}
            onChange={(_event, value: TransferMode) => changeMode(value)}
            variant="fullWidth"
            aria-label="Transfer options"
          >
            <Tab value="internal" label="Transfer between accounts" disabled={busy} />
            <Tab value="external" label="Send to someone else" disabled={busy} />
          </Tabs>

          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 750, mb: 0.75 }}>
              {isExternal ? 'Send to someone else' : 'Transfer between accounts'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {isExternal
                ? 'Enter the exact account ID you want to pay. We will confirm who owns it before anything is sent.'
                : 'Choose the account to move money out of, and the account to move it into.'}
            </Typography>

            {success && (
              <Alert severity="success" sx={{ mb: 2.5 }}>
                {success}
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 2.5 }}>
                {error}
              </Alert>
            )}

            {accounts.length === 0 ? (
              <Alert severity="info">
                You need an account before you can move money.
              </Alert>
            ) : !isExternal && accounts.length < 2 ? (
              <Alert severity="info">
                Transferring between accounts needs at least two accounts. Open another one,
                or use the Send tab to pay someone else.
              </Alert>
            ) : (
              <Box component="form" onSubmit={submit} noValidate>
                <Box sx={{ display: 'grid', gap: 2.25 }}>
                  <TextField
                    select
                    label="From account"
                    value={fromId}
                    onChange={(event) => {
                      const nextId = Number(event.target.value);
                      setFromId(nextId);
                      // Keeps the pair valid if the new source is the current destination
                      if (nextId === toId) {
                        setToId('');
                      }
                    }}
                    disabled={busy}
                    required
                  >
                    {accounts.map((account) => (
                      <MenuItem key={account.account_id} value={account.account_id}>
                        {describeAccount(account)}
                      </MenuItem>
                    ))}
                  </TextField>

                  {isExternal ? (
                    <>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <TextField
                          label="Recipient account ID"
                          value={recipientQuery}
                          onChange={(event) => {
                            setRecipientQuery(event.target.value);
                            // A confirmed recipient must not outlive the ID it came from
                            clearRecipient();
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              lookupRecipient();
                            }
                          }}
                          error={Boolean(lookupError)}
                          helperText={lookupError || 'Must match an account ID exactly.'}
                          disabled={busy}
                        />
                        <Button
                          type="button"
                          variant="outlined"
                          onClick={lookupRecipient}
                          disabled={busy || lookupBusy || recipientQuery.trim() === ''}
                          startIcon={
                            lookupBusy ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : (
                              <SearchRoundedIcon />
                            )
                          }
                          sx={{ mt: 1, flexShrink: 0 }}
                        >
                          Search
                        </Button>
                      </Box>

                      {recipient && (
                        <Alert severity="info" icon={false}>
                          Found <strong>{recipient.owner_name}</strong> — account #
                          {recipient.account_id}.
                        </Alert>
                      )}
                    </>
                  ) : (
                    <TextField
                      select
                      label="To account"
                      value={toId}
                      onChange={(event) => setToId(Number(event.target.value))}
                      disabled={busy || fromId === ''}
                      required
                      helperText="Your other accounts only."
                    >
                      {accounts
                        .filter((account) => account.account_id !== fromId)
                        .map((account) => (
                          <MenuItem key={account.account_id} value={account.account_id}>
                            {describeAccount(account)}
                          </MenuItem>
                        ))}
                    </TextField>
                  )}

                  <TextField
                    label="Amount"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    disabled={busy || (isExternal && recipient === null)}
                    required
                    error={overBalance}
                    helperText={
                      overBalance
                        ? `That is more than the ${formatCurrency(fromAccount!.balance_cents)} available.`
                        : fromAccount
                          ? `${formatCurrency(fromAccount.balance_cents)} available.`
                          : ' '
                    }
                    slotProps={{
                      input: { startAdornment: <Box sx={{ mr: 0.75, color: 'text.secondary' }}>$</Box> },
                      htmlInput: { inputMode: 'decimal', placeholder: '0.00' },
                    }}
                  />

                  {isExternal && recipient && amountCents !== null && !overBalance && (
                    <Alert severity="warning" icon={false}>
                      Are you sure you would like to send{' '}
                      <strong>{formatCurrency(amountCents)}</strong> to{' '}
                      <strong>{recipientFirstName}</strong>?
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={!canSubmit}
                    sx={{ mt: 0.5 }}
                  >
                    {busy ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : isExternal ? (
                      'Send money'
                    ) : (
                      'Transfer'
                    )}
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
