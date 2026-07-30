import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  MenuItem,
  Pagination,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import * as api from '../api';
import type { Account, PublicUser, Transaction, TransactionType } from '../api';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatDateTime } from '../utils/date';
import { formatCurrency } from '../utils/money';
import { maskAccountId } from '../utils/objectId';

interface SearchAccountsPageProps {
  user: PublicUser;
  accounts: Account[];
  onLogout: () => void;
}

const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS'] as const;
const RESULT_PAGE_SIZE = 6;

type SortKey =
  | 'transactionCount'
  | 'transactionsAmount'
  | 'gross'
  | 'createdAt'
  | 'updatedAt';

type SortDirection = 'asc' | 'desc';

const SORT_OPTIONS: { value: SortKey; label: string; hint: string }[] = [
  { value: 'transactionCount', label: 'Transaction Count', hint: 'How many transactions the account has.' },
  { value: 'transactionsAmount', label: 'Transactions Amount', hint: 'Net movement: money in minus money out.' },
  { value: 'gross', label: 'Gross', hint: 'Total moved in either direction.' },
  { value: 'createdAt', label: 'Date Created', hint: 'When the account was opened.' },
  { value: 'updatedAt', label: 'Date Updated', hint: 'When the account last had activity.' },
];

/** Which transaction types add to a balance rather than subtract from it. */
const INCOMING: Record<TransactionType, boolean> = {
  DEPOSIT: true,
  TRANSFER_IN: true,
  WITHDRAWAL: false,
  TRANSFER_OUT: false,
};

interface AccountStats {
  transactionCount: number;
  /** Net movement — deposits and transfers in, less withdrawals and transfers out. */
  transactionsAmountCents: number;
  /** Every transaction added together regardless of direction. */
  grossCents: number;
  /** Latest activity. Accounts have no updated_at, so this is the newest transaction. */
  updatedAt: string;
}

function emptyStats(account: Account): AccountStats {
  return {
    transactionCount: 0,
    transactionsAmountCents: 0,
    grossCents: 0,
    updatedAt: account.created_at,
  };
}

function computeStats(account: Account, transactions: Transaction[]): AccountStats {
  const stats = emptyStats(account);
  stats.transactionCount = transactions.length;

  for (const transaction of transactions) {
    stats.transactionsAmountCents += INCOMING[transaction.txn_type]
      ? transaction.amount_cents
      : -transaction.amount_cents;
    stats.grossCents += transaction.amount_cents;
    // ISO-8601 strings in a fixed format sort correctly as plain text
    if (transaction.created_at > stats.updatedAt) {
      stats.updatedAt = transaction.created_at;
    }
  }

  return stats;
}

export default function SearchAccountsPage({
  user,
  accounts,
  onLogout,
}: SearchAccountsPageProps) {
  useDocumentTitle('Search Accounts');

  const [query, setQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([...ACCOUNT_TYPES]);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(1);

  const [stats, setStats] = useState<Record<string, AccountStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sorting by transaction count, amount, gross or last activity needs the
  // transactions themselves — an account only carries its balance and open date.
  useEffect(() => {
    let active = true;

    async function loadStats() {
      if (accounts.length === 0) {
        setStats({});
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const entries = await Promise.all(
          accounts.map(async (account) => {
            const transactions = await api.getTransactions(account.account_id);
            return [account.account_id, computeStats(account, transactions)] as const;
          }),
        );

        if (active) {
          setStats(Object.fromEntries(entries));
        }
      } catch (err) {
        if (active) {
          setStats({});
          setError((err as Error).message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      active = false;
    };
  }, [accounts]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();

    const matching = accounts.filter((account) => {
      if (!selectedTypes.includes(account.account_type)) {
        return false;
      }
      return needle === '' || account.account_id.toLowerCase().includes(needle);
    });

    function statsFor(account: Account): AccountStats {
      return stats[account.account_id] ?? emptyStats(account);
    }

    function compare(first: Account, second: Account): number {
      switch (sortKey) {
        case 'transactionCount':
          return statsFor(first).transactionCount - statsFor(second).transactionCount;
        case 'transactionsAmount':
          return (
            statsFor(first).transactionsAmountCents -
            statsFor(second).transactionsAmountCents
          );
        case 'gross':
          return statsFor(first).grossCents - statsFor(second).grossCents;
        case 'updatedAt':
          return statsFor(first).updatedAt.localeCompare(statsFor(second).updatedAt);
        case 'createdAt':
        default:
          return first.created_at.localeCompare(second.created_at);
      }
    }

    // Copy first — sort mutates, and `accounts` belongs to App
    return [...matching].sort(
      (first, second) => (sortDirection === 'asc' ? 1 : -1) * compare(first, second),
    );
  }, [accounts, query, selectedTypes, sortKey, sortDirection, stats]);

  const totalPages = Math.max(1, Math.ceil(results.length / RESULT_PAGE_SIZE));
  const visibleResults = results.slice((page - 1) * RESULT_PAGE_SIZE, page * RESULT_PAGE_SIZE);

  // Narrowing the filters can strand the viewer on a page that no longer exists
  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  function toggleType(accountType: string) {
    setSelectedTypes((current) =>
      current.includes(accountType)
        ? current.filter((value) => value !== accountType)
        : [...current, accountType],
    );
    setPage(1);
  }

  const activeSort = SORT_OPTIONS.find((option) => option.value === sortKey);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader user={user} onLogout={onLogout} />

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <PageHeader
          title="Search Accounts"
          description="Filter and sort every account on your profile."
          backTo="/"
          action={
            !loading ? (
              <Chip
                label={`${results.length} ${results.length === 1 ? 'result' : 'results'}`}
                variant="outlined"
              />
            ) : undefined
          }
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2.5 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Box sx={{ display: 'grid', gap: 2.5 }}>
              <TextField
                label="Account ID"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Paste or type part of an account ID"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Divider />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'auto 1fr auto' },
                  gap: 2.5,
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Account type
                  </Typography>
                  <FormGroup row>
                    {ACCOUNT_TYPES.map((accountType) => (
                      <FormControlLabel
                        key={accountType}
                        control={
                          <Checkbox
                            checked={selectedTypes.includes(accountType)}
                            onChange={() => toggleType(accountType)}
                          />
                        }
                        label={
                          accountType.charAt(0) + accountType.slice(1).toLowerCase()
                        }
                      />
                    ))}
                  </FormGroup>
                </Box>

                <TextField
                  select
                  label="Sort by"
                  value={sortKey}
                  onChange={(event) => {
                    setSortKey(event.target.value as SortKey);
                    setPage(1);
                  }}
                  helperText={activeSort?.hint}
                >
                  {SORT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                <ToggleButtonGroup
                  exclusive
                  value={sortDirection}
                  onChange={(_event, value: SortDirection | null) => {
                    // Null when the active button is clicked again — keep the current order
                    if (value !== null) {
                      setSortDirection(value);
                    }
                  }}
                  aria-label="Sort direction"
                  sx={{ alignSelf: { xs: 'start', md: 'center' } }}
                >
                  <ToggleButton value="asc" aria-label="Ascending">
                    <ArrowUpwardRoundedIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="desc" aria-label="Descending">
                    <ArrowDownwardRoundedIcon fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {loading ? (
          <LoadingState message="Loading your accounts…" />
        ) : selectedTypes.length === 0 ? (
          <EmptyState
            icon={<SearchOffRoundedIcon color="disabled" sx={{ fontSize: 46 }} />}
            title="No account type selected"
            description="Tick Checking or Savings to see results."
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<SearchOffRoundedIcon color="disabled" sx={{ fontSize: 46 }} />}
            title="No accounts match"
            description={
              query.trim() === ''
                ? 'No accounts of the selected type yet.'
                : 'No account ID contains that text. Check the ID and try again.'
            }
            action={
              query.trim() !== '' ? (
                <Button variant="outlined" onClick={() => setQuery('')}>
                  Clear search
                </Button>
              ) : undefined
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
              {visibleResults.map((account) => {
                const accountStats = stats[account.account_id] ?? emptyStats(account);

                return (
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
                      <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, mb: 2.5 }}>
                        {formatCurrency(account.balance_cents)}
                      </Typography>

                      <Divider sx={{ mb: 2 }} />

                      <Box sx={{ display: 'grid', gap: 1 }}>
                        <MetricRow
                          label="Transactions"
                          value={String(accountStats.transactionCount)}
                        />
                        <MetricRow
                          label="Net amount"
                          value={`${accountStats.transactionsAmountCents < 0 ? '−' : ''}${formatCurrency(Math.abs(accountStats.transactionsAmountCents))}`}
                        />
                        <MetricRow
                          label="Gross"
                          value={formatCurrency(accountStats.grossCents)}
                        />
                        <MetricRow
                          label="Created"
                          value={formatDateTime(account.created_at)}
                        />
                        <MetricRow
                          label="Last activity"
                          value={
                            accountStats.transactionCount === 0
                              ? 'No activity'
                              : formatDateTime(accountStats.updatedAt)
                          }
                        />
                      </Box>
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
                );
              })}
            </Box>

            {results.length > RESULT_PAGE_SIZE && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_event, nextPage) => setPage(nextPage)}
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

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 700, textAlign: 'right' }}>
        {value}
      </Typography>
    </Box>
  );
}
