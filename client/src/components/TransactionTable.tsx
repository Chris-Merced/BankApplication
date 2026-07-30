import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { Transaction, TransactionType } from '../api';
import { formatDateTime } from '../utils/date';
import { formatCurrency } from '../utils/money';

interface TransactionTableProps {
  transactions: Transaction[];
  ariaLabel?: string;
  resetKey?: string;
}

interface TransactionDisplay {
  label: string;
  incoming: boolean;
  color: 'success' | 'error' | 'primary' | 'warning';
}

const TRANSACTION_DISPLAY: Record<TransactionType, TransactionDisplay> = {
  DEPOSIT: { label: 'Deposit', incoming: true, color: 'success' },
  WITHDRAWAL: { label: 'Withdrawal', incoming: false, color: 'error' },
  TRANSFER_IN: { label: 'Transfer In', incoming: true, color: 'primary' },
  TRANSFER_OUT: { label: 'Transfer Out', incoming: false, color: 'warning' },
};

export default function TransactionTable({
  transactions,
  ariaLabel = 'Transaction history',
  resetKey,
}: TransactionTableProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const lastPage = Math.max(0, Math.ceil(transactions.length / rowsPerPage) - 1);
  const visiblePage = Math.min(page, lastPage);
  const visibleTransactions = transactions.slice(
    visiblePage * rowsPerPage,
    visiblePage * rowsPerPage + rowsPerPage,
  );

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, lastPage));
  }, [lastPage]);

  return (
    <>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 760 }} aria-label={ariaLabel}>
          <TableHead>
            <TableRow>
              <TableCell>Transaction ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleTransactions.map((transaction) => {
              const display = TRANSACTION_DISPLAY[transaction.txn_type];

              return (
                <TableRow key={transaction.txn_id} hover>
                  <TableCell
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {transaction.txn_id}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={display.label}
                      color={display.color}
                      variant={display.incoming ? 'filled' : 'outlined'}
                      size="small"
                    />
                    {transaction.related_account_id && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.75 }}
                      >
                        Related: {transaction.related_account_id}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 800,
                      color: display.incoming ? 'success.main' : 'error.main',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {display.incoming ? '+' : '−'}
                    {formatCurrency(transaction.amount_cents)}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {formatDateTime(transaction.created_at)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={transactions.length}
        page={visiblePage}
        onPageChange={(_event, nextPage) => setPage(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </>
  );
}
