import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AddCardRoundedIcon from '@mui/icons-material/AddCardRounded';
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Container,
	Divider,
	MenuItem,
	TextField,
	Typography,
} from '@mui/material';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import * as api from '../api';
import type { Account, PublicUser } from '../api';
import AppHeader from '../components/AppHeader';
import PageHeader from '../components/PageHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';

type AccountType = 'CHECKING' | 'SAVINGS';

const ACCOUNT_TYPES: AccountType[] = ['CHECKING', 'SAVINGS'];

interface CreateAccountPageProps {
	user: PublicUser;
	onLogout: () => void;
	onAccountCreated: (account: Account) => void;
}

export default function CreateAccountPage({
	user,
	onLogout,
	onAccountCreated,
}: CreateAccountPageProps) {
	useDocumentTitle('Create Account');

	const navigate = useNavigate();
	const [accountType, setAccountType] = useState<AccountType>('CHECKING');
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		setBusy(true);

		try {
			const account = await api.createAccount(accountType);
			onAccountCreated(account);
			navigate(`/accounts/${account.account_id}`, { replace: true });
		} catch (err) {
			setError((err as Error).message);
		} finally {
			setBusy(false);
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
					title="Create Account"
					description="Open a new checking or savings account for the signed-in user."
					backTo="/"
				/>

				<Card>
					<CardContent sx={{ p: { xs: 3, sm: 4 } }}>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 1.5,
								mb: 3,
							}}
						>
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
								<AddCardRoundedIcon />
							</Box>
							<Box>
								<Typography variant="h5" component="h2" sx={{ fontWeight: 750 }}>
									Account setup
								</Typography>
								<Typography color="text.secondary">
									Confirm the user details and choose the account type.
								</Typography>
							</Box>
						</Box>

						{error && (
							<Alert severity="error" sx={{ mb: 3 }}>
								{error}
							</Alert>
						)}

						<Box component="form" onSubmit={submit} noValidate>
							<Box sx={{ display: 'grid', gap: 2.5 }}>
								<Box
									sx={{
										p: { xs: 2.25, sm: 3 },
										borderRadius: 3,
										bgcolor: 'action.hover',
										border: '1px solid',
										borderColor: 'divider',
									}}
								>
									<Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.12em' }}>
										Account owner
									</Typography>
									<Box
										sx={{
											display: 'grid',
											gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
											gap: 2,
											mt: 1.25,
										}}
									>
										<Box>
											<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
												Full name
											</Typography>
											<Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>
												{user.name}
											</Typography>
										</Box>
										<Box>
											<Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
												Email address
											</Typography>
											<Typography variant="h6" component="p" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
												{user.email}
											</Typography>
										</Box>
									</Box>
								</Box>

								<Divider />

								<TextField
									select
									label="Account type"
									value={accountType}
									onChange={(event: ChangeEvent<HTMLInputElement>) => setAccountType(event.target.value as AccountType)}
									helperText="Checking and savings accounts are available."
									disabled={busy}
								>
									{ACCOUNT_TYPES.map((type) => (
										<MenuItem key={type} value={type}>
											{type === 'CHECKING' ? 'Checking' : 'Savings'}
										</MenuItem>
									))}
								</TextField>

								<Box
									sx={{
										display: 'grid',
										gap: 1.5,
										pt: 1,
									}}
								>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
										<AccountBalanceRoundedIcon color="primary" />
										<Typography color="text.secondary">
											This account will be linked to {user.name}.
										</Typography>
									</Box>

									<Button type="submit" variant="contained" size="large" disabled={busy} fullWidth>
										{busy ? (
											<CircularProgress size={22} color="inherit" />
										) : (
											'Create Account'
										)}
									</Button>
								</Box>
							</Box>
						</Box>
					</CardContent>
				</Card>
			</Container>
		</Box>
	);
}
