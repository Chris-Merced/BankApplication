import { Box, Container } from '@mui/material';
import Admin from '../Admin';
import type { PublicUser } from '../api';
import AppHeader from '../components/AppHeader';
import PageHeader from '../components/PageHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';

interface AdminPageProps {
  user: PublicUser;
  onLogout: () => void;
}

export default function AdminPage({ user, onLogout }: AdminPageProps) {
  useDocumentTitle('Admin');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader user={user} onLogout={onLogout} />
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <PageHeader
          title="Admin"
          description="Manage users, roles, accounts, and transaction history."
          backTo="/"
        />
        <Admin currentUserId={user.user_id} />
      </Container>
    </Box>
  );
}
