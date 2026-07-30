import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import * as api from '../api';
import type { Account, PublicUser, Transaction } from '../api';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import TransactionTable from '../components/TransactionTable';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatCurrency } from '../utils/money';
import { isObjectId } from '../utils/objectId';

interface TransactionHistoryPageProps {
  user: PublicUser;
  onLogout: () => void;
}

export default function TransactionHistoryPage({
  user,
  onLogout,
}: TransactionHistoryPageProps) {
  const { accountId } = useParams();

  useDocumentTitle('Transaction History');

  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      if (!isObjectId(accountId)) {
        setError('Invalid account ID.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [loadedAccount, loadedTransactions] = await Promise.all([
          api.getAccount(accountId),
          api.getTransactions(accountId),
        ]);

        if (active) {
          setAccount(loadedAccount);
          setTransactions(loadedTransactions);
        }
      } catch (err) {
        if (active) {
          setAccount(null);
          setTransactions([]);
          setError((err as Error).message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [accountId]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader user={user} onLogout={onLogout} />

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <PageHeader
          title="Transaction History"
          description="Review deposits, withdrawals, and transfers for this account."
          backTo={account ? `/accounts/${account.account_id}` : '/'}
          action={
            account ? (
              <Chip
                label={`${transactions.length} ${
                  transactions.length === 1 ? 'transaction' : 'transactions'
                }`}
                variant="outlined"
              />
            ) : undefined
          }
        />

        {loading ? (
          <LoadingState message="Loading transaction history…" />
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : account ? (
          <Box sx={{ display: 'grid', gap: 2.5 }}>
            <Card>
              <CardContent
                sx={{
                  p: { xs: 3, sm: 4 },
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="overline" color="text.secondary">
                    {account.account_type} account
                  </Typography>
                  <Typography sx={{ fontWeight: 750, overflowWrap: 'anywhere' }}>
                    #{account.account_id}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography variant="body2" color="text.secondary">
                    Current balance
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {formatCurrency(account.balance_cents)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {transactions.length === 0 ? (
              <EmptyState
                icon={<ReceiptLongRoundedIcon color="disabled" sx={{ fontSize: 46 }} />}
                title="No transactions yet"
                description="Deposits, withdrawals, and transfers will appear here."
              />
            ) : (
              <Card>
                <TransactionTable transactions={transactions} />
              </Card>
            )}
          </Box>
        ) : null}
      </Container>
    </Box>
  );
}
