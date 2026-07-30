import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Container,
	Divider,
	TextField,
	Typography,
} from '@mui/material';
import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import * as api from '../api';
import type { Account, PublicUser } from '../api';
import AppHeader from '../components/AppHeader';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatCurrency, parseDollarsToCents } from '../utils/money';
import { isObjectId } from '../utils/objectId';

interface DepositPageProps {
	user: PublicUser;
	onLogout: () => void;
	onAccountUpdated: (account: Account) => void;
}

export default function DepositPage({
	user,
	onLogout,
	onAccountUpdated,
}: DepositPageProps) {
	const { accountId: accountIdParam } = useParams();
	const accountId = accountIdParam;
	const navigate = useNavigate();

	useDocumentTitle('Deposit');

	const [account, setAccount] = useState<Account | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');
	const [amount, setAmount] = useState('');

	const amountCents = parseDollarsToCents(amount);

	const projectedBalanceCents = useMemo(() => {
		if (!account || amountCents === null || amountCents <= 0) {
			return null;
		}

		return account.balance_cents + amountCents;
	}, [account, amountCents]);

	useEffect(() => {
		let active = true;

		async function loadAccount() {
			if (!isObjectId(accountId)) {
				setError('Invalid account ID.');
				setLoading(false);
				return;
			}

			setLoading(true);
			setError('');

			try {
				const loadedAccount = await api.getAccount(accountId);

				if (!active) {
					return;
				}

				setAccount(loadedAccount);
			} catch (err) {
				if (!active) {
					return;
				}

				setAccount(null);
				setError((err as Error).message);
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		}

		void loadAccount();

		return () => {
			active = false;
		};
	}, [accountId]);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');

		if (!account) {
			return;
		}

		if (amountCents === null) {
			setError('Enter a positive dollar amount with no more than two decimal places.');
			return;
		}

		setSubmitting(true);

		try {
			const updatedAccount = await api.deposit(account.account_id, amountCents);
			onAccountUpdated(updatedAccount);
			navigate(`/accounts/${account.account_id}`, { replace: true });
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setSubmitting(false);
		}
	}

	function logout() {
		onLogout();
	}

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
			<AppHeader user={user} onLogout={logout} />

			<Container component="main" maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
				<PageHeader
					title="Deposit"
					description="Add funds to the selected account and review the new projected balance."
					backTo={account ? `/accounts/${account.account_id}` : '/'}
				/>

				{loading ? (
					<LoadingState message="Loading account for deposit…" />
				) : error && !account ? (
					<Alert severity="error">{error}</Alert>
				) : account ? (
					<Box sx={{ display: 'grid', gap: 2.5 }}>
						<Card>
							<CardContent sx={{ p: { xs: 3, sm: 4 } }}>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
									<Box
										sx={{
											width: 48,
											height: 48,
											display: 'grid',
											placeItems: 'center',
											borderRadius: 3,
											bgcolor: 'primary.main',
											color: 'primary.contrastText',
										}}
									>
										<AccountBalanceRoundedIcon />
									</Box>
									<Box>
										<Typography variant="h5" component="h2" sx={{ fontWeight: 750 }}>
											Selected account
										</Typography>
										<Typography color="text.secondary">
											#{account.account_id} · {account.account_type} · current balance {formatCurrency(account.balance_cents)}
										</Typography>
									</Box>
								</Box>

								<Box
									sx={{
										display: 'grid',
										gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
										gap: 2,
									}}
								>
									<Box>
										<Typography variant="body2" color="text.secondary">
											Current balance
										</Typography>
										<Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
											{formatCurrency(account.balance_cents)}
										</Typography>
									</Box>
									<Box>
										<Typography variant="body2" color="text.secondary">
											Projected balance
										</Typography>
										<Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
											{projectedBalanceCents === null
												? '—'
												: formatCurrency(projectedBalanceCents)}
										</Typography>
									</Box>
								</Box>
							</CardContent>
						</Card>

						<Card>
							<CardContent sx={{ p: { xs: 3, sm: 4 } }}>
								<Typography variant="h5" component="h2" sx={{ fontWeight: 750, mb: 0.75 }}>
									Deposit funds
								</Typography>
								<Typography color="text.secondary" sx={{ mb: 3 }}>
									Enter a positive dollar amount. The app converts it to cents before submitting.
								</Typography>

								{error && (
									<Alert severity="error" sx={{ mb: 3 }}>
										{error}
									</Alert>
								)}

								<Box component="form" onSubmit={submit} noValidate>
									<Box sx={{ display: 'grid', gap: 2.5 }}>
										<TextField
											label="Deposit amount"
											value={amount}
											onChange={(event: ChangeEvent<HTMLInputElement>) => setAmount(event.target.value)}
											type="number"
											slotProps={{ htmlInput: { min: 0.01, step: '0.01', inputMode: 'decimal' } }}
											helperText="Use dollars and cents, for example 25.00."
											disabled={submitting}
											required
										/>

										<Divider />

										<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
											<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
												<AccountBalanceWalletRoundedIcon color="primary" />
												<Typography color="text.secondary">
													Deposits are posted to account #{account.account_id}.
												</Typography>
											</Box>

											<Button
												type="submit"
												variant="contained"
												size="large"
												disabled={submitting || amountCents === null}
												startIcon={<TrendingUpRoundedIcon />}
												sx={{ ml: 'auto' }}
											>
												Deposit
											</Button>
										</Box>
									</Box>
								</Box>
							</CardContent>
						</Card>
					</Box>
				) : null}
			</Container>
		</Box>
	);
}
