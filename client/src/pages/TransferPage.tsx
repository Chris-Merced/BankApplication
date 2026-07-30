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
import type { Account, PublicUser } from '../api';
import * as api from '../api';
import AppHeader from '../components/AppHeader';
import PageHeader from '../components/PageHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatCurrency, parseDollarsToCents } from '../utils/money';
import { isObjectId } from '../utils/objectId';

type TransferMode = 'internal' | 'external';

interface TransferPageProps {
  user: PublicUser;
  accounts: Account[];
  onLogout: () => void;
  onTransferComplete: () => Promise<void>;
}

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
  const [fromId, setFromId] = useState(accounts[0]?.account_id ?? '');
  const [toId, setToId] = useState('');
  const [recipientAccountId, setRecipientAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const isExternal = mode === 'external';
  const fromAccount = accounts.find((account) => account.account_id === fromId) ?? null;
  const amountCents = parseDollarsToCents(amount);
  const trimmedRecipientId = recipientAccountId.trim();
  const recipientIdIsValid = isObjectId(trimmedRecipientId);
  const recipientIsOwnAccount = accounts.some(
    (account) => account.account_id === trimmedRecipientId,
  );
  const overBalance =
    fromAccount !== null && amountCents !== null && amountCents > fromAccount.balance_cents;
  const destinationId = isExternal ? trimmedRecipientId : toId;

  function changeMode(nextMode: TransferMode) {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setAmount('');
    setToId('');
    setRecipientAccountId('');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!fromId || amountCents === null) {
      setError('Choose a source account and enter a positive amount.');
      return;
    }

    if (!destinationId || (isExternal && !recipientIdIsValid)) {
      setError('Enter a valid 24-character destination account ID.');
      return;
    }

    if (destinationId === fromId) {
      setError('The source and destination accounts must be different.');
      return;
    }

    if (overBalance) {
      setError('The transfer amount exceeds the available balance.');
      return;
    }

    setBusy(true);

    try {
      const result = await api.transfer(fromId, destinationId, amountCents);
      setSuccess(
        `Sent ${formatCurrency(amountCents)} to account #${result.to.account_id}.`,
      );
      setAmount('');
      setToId('');
      setRecipientAccountId('');
      await onTransferComplete();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    !busy &&
    fromId !== '' &&
    amountCents !== null &&
    !overBalance &&
    destinationId !== '' &&
    destinationId !== fromId &&
    (!isExternal || (recipientIdIsValid && !recipientIsOwnAccount));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader user={user} onLogout={onLogout} />

      <Container component="main" maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
        <PageHeader
          title="Transfer & Send"
          description="Move money between your own accounts, or send it to another account."
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
            <Tab value="external" label="Send to another account" disabled={busy} />
          </Tabs>

          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 750, mb: 0.75 }}>
              {isExternal ? 'Send to another account' : 'Transfer between accounts'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {isExternal
                ? 'Enter the exact destination account ID and confirm it before sending.'
                : 'Choose the accounts to move money out of and into.'}
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
                Transferring between your accounts requires at least two accounts.
                Use the Send tab to transfer to a different user&apos;s account.
              </Alert>
            ) : (
              <Box component="form" onSubmit={submit} noValidate>
                <Box sx={{ display: 'grid', gap: 2.25 }}>
                  <TextField
                    select
                    label="From account"
                    value={fromId}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      setFromId(nextId);
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
                    <TextField
                      label="Destination account ID"
                      value={recipientAccountId}
                      onChange={(event) => setRecipientAccountId(event.target.value)}
                      disabled={busy}
                      required
                      error={
                        recipientAccountId.trim() !== '' &&
                        (!recipientIdIsValid || recipientIsOwnAccount)
                      }
                      helperText={
                        recipientIsOwnAccount
                          ? 'Use the Transfer tab for one of your own accounts.'
                          : recipientAccountId.trim() !== '' && !recipientIdIsValid
                            ? 'Enter the full 24-character account ID.'
                            : 'Confirm this ID with the recipient before sending.'
                      }
                      slotProps={{
                        htmlInput: {
                          autoCapitalize: 'none',
                          spellCheck: false,
                        },
                      }}
                    />
                  ) : (
                    <TextField
                      select
                      label="To account"
                      value={toId}
                      onChange={(event) => setToId(event.target.value)}
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
                    disabled={busy}
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
                      input: {
                        startAdornment: (
                          <Box sx={{ mr: 0.75, color: 'text.secondary' }}>$</Box>
                        ),
                      },
                      htmlInput: { inputMode: 'decimal', placeholder: '0.00' },
                    }}
                  />

                  {isExternal &&
                    recipientIdIsValid &&
                    !recipientIsOwnAccount &&
                    amountCents !== null &&
                    !overBalance && (
                      <Alert severity="warning" icon={false}>
                        Confirm the destination account ID before sending{' '}
                        <strong>{formatCurrency(amountCents)}</strong>. Transfers are
                        recorded immediately.
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
