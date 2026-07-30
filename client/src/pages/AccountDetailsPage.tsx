import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SouthEastRoundedIcon from '@mui/icons-material/SouthEastRounded';
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Container,
	Divider,
	Snackbar,
	Stack,
	Typography,
} from '@mui/material';
import { type MouseEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import * as api from '../api';
import type { Account, PublicUser } from '../api';
import AppHeader from '../components/AppHeader';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatDateTime } from '../utils/date';
import { formatCurrency } from '../utils/money';
import { isObjectId } from '../utils/objectId';

interface AccountDetailsPageProps {
	user: PublicUser;
	onLogout: () => void;
}

function maskAccountId(accountId: string, reveal = false): string {
	const digits = accountId;

	if (reveal || digits.length <= 2) {
		return digits;
	}

	const visibleDigits = Math.ceil(digits.length / 2);
	return `${digits.slice(0, visibleDigits)}${'•'.repeat(digits.length - visibleDigits)}`;
}

export default function AccountDetailsPage({ user, onLogout }: AccountDetailsPageProps) {
	const { accountId: accountIdParam } = useParams();
	const accountId = accountIdParam;

	useDocumentTitle('Account Details');

	const [account, setAccount] = useState<Account | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [copyNoticeOpen, setCopyNoticeOpen] = useState(false);
	const [revealAccountId, setRevealAccountId] = useState(false);

	const accountTypeLabel = useMemo(() => {
		if (!account) {
			return '';
		}

		return account.account_type === 'SAVINGS' ? 'Savings' : 'Checking';
	}, [account]);

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

	async function copyAccountId(event: MouseEvent<HTMLButtonElement>) {
		event.preventDefault();

		if (!account) {
			return;
		}

		try {
			await navigator.clipboard.writeText(String(account.account_id));
			setCopyNoticeOpen(true);
		} catch {
			setError('Unable to copy the account ID right now.');
		}
	}

	function logout() {
		onLogout();
	}

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
			<AppHeader user={user} onLogout={logout} />

			<Container component="main" maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
				<PageHeader
					title="Account Details"
					description="Review the account, then choose the next action."
					backTo="/"
					action={
						account ? (
							<Chip label={accountTypeLabel} color={account.account_type === 'SAVINGS' ? 'secondary' : 'primary'} />
						) : undefined
					}
				/>

				{loading ? (
					<LoadingState message="Loading account details…" />
				) : error ? (
					<Alert severity="error">{error}</Alert>
				) : account ? (
					<Box sx={{ display: 'grid', gap: 2.5 }}>
						<Card
							sx={{
								overflow: 'hidden',
								color: 'common.white',
								background:
									'linear-gradient(120deg, #073b91 0%, #0b57d0 55%, #2271df 100%)',
							}}
						>
							<CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
								<Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: '0.12em' }}>
									Account overview
								</Typography>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'flex-start',
										justifyContent: 'space-between',
										gap: 2,
										flexWrap: 'wrap',
										mt: 0.75,
									}}
								>
									<Box>
										<Typography variant="h1" component="h1" sx={{ mb: 0.75 }}>
											#{maskAccountId(account.account_id, revealAccountId)}
										</Typography>
										<Typography sx={{ maxWidth: 640, opacity: 0.88, fontSize: '1.05rem' }}>
											{user.name} opened a {accountTypeLabel.toLowerCase()} account on{' '}
											{formatDateTime(account.created_at)}.
										</Typography>
									</Box>

									<Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
										<Button
											variant="outlined"
											onClick={() => setRevealAccountId((current) => !current)}
											startIcon={<VisibilityRoundedIcon />}
											sx={{
												borderColor: 'rgba(255,255,255,0.35)',
												color: 'common.white',
												'&:hover': { borderColor: 'rgba(255,255,255,0.6)' },
											}}
										>
											{revealAccountId ? 'Hide ID' : 'View ID'}
										</Button>
										<Button
											variant="contained"
											onClick={copyAccountId}
											startIcon={<ContentCopyRoundedIcon />}
											sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: 'common.white' }}
										>
											Copy ID
										</Button>
									</Box>
								</Box>
							</CardContent>
						</Card>

						<Box
							sx={{
								display: 'grid',
								gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.4fr) minmax(320px, 0.8fr)' },
								gap: 2.5,
							}}
						>
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
												Account summary
											</Typography>
											<Typography color="text.secondary">
												The key details for this account are shown below.
											</Typography>
										</Box>
									</Box>

									<Stack divider={<Divider flexItem />} spacing={2.25}>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
											<Typography color="text.secondary">Account ID</Typography>
											<Typography sx={{ fontWeight: 700 }}>#{maskAccountId(account.account_id, revealAccountId)}</Typography>
										</Box>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
											<Typography color="text.secondary">User name</Typography>
											<Typography sx={{ fontWeight: 700, textAlign: 'right' }}>{user.name}</Typography>
										</Box>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
											<Typography color="text.secondary">Account type</Typography>
											<Typography sx={{ fontWeight: 700 }}>{accountTypeLabel}</Typography>
										</Box>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
											<Typography color="text.secondary">Balance</Typography>
											<Typography sx={{ fontWeight: 800 }}>{formatCurrency(account.balance_cents)}</Typography>
										</Box>
										<Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
											<Typography color="text.secondary">Created</Typography>
											<Typography sx={{ fontWeight: 700, textAlign: 'right' }}>
												{formatDateTime(account.created_at)}
											</Typography>
										</Box>
									</Stack>
								</CardContent>
							</Card>

							<Card>
								<CardContent sx={{ p: { xs: 3, sm: 4 } }}>
									<Typography variant="h5" component="h2" sx={{ fontWeight: 750, mb: 1 }}>
										Actions
									</Typography>
									<Typography color="text.secondary" sx={{ mb: 3 }}>
										Move funds or inspect the transaction history for this account.
									</Typography>

									<Stack spacing={1.5}>
										<Button
											component={Link}
											to={`/accounts/${account.account_id}/deposit`}
											variant="contained"
											startIcon={<SouthEastRoundedIcon />}
											fullWidth
										>
											Deposit
										</Button>
										<Button
											component={Link}
											to={`/accounts/${account.account_id}/withdraw`}
											variant="outlined"
											startIcon={<NorthEastRoundedIcon />}
											fullWidth
										>
											Withdraw
										</Button>
										<Button
											component={Link}
											to={`/accounts/${account.account_id}/transactions`}
											variant="text"
											startIcon={<ReceiptLongRoundedIcon />}
											fullWidth
										>
											View Transactions
										</Button>
									</Stack>

									<Divider sx={{ my: 3 }} />

									<Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
										<PaymentsRoundedIcon color="secondary" sx={{ mt: 0.25 }} />
										<Typography color="text.secondary">
											Use these actions to manage the balance after reviewing the account summary.
										</Typography>
									</Box>
								</CardContent>
							</Card>
						</Box>
					</Box>
				) : null}
			</Container>

			<Snackbar
				open={copyNoticeOpen}
				autoHideDuration={2000}
				onClose={() => setCopyNoticeOpen(false)}
				message="Account ID copied to clipboard"
			/>
		</Box>
	);
}
