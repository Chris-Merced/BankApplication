import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
} from '@mui/material';
import type { PublicUser } from '../api';
import AppHeader from '../components/AppHeader';
import PageHeader from '../components/PageHeader';
import useDocumentTitle from '../hooks/useDocumentTitle';

interface PlannedPageProps {
  user: PublicUser;
  title: string;
  onLogout: () => void;
}

export default function PlannedPage({ user, title, onLogout }: PlannedPageProps) {
  useDocumentTitle(title);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader user={user} onLogout={onLogout} />
      <Container component="main" maxWidth="sm" sx={{ py: { xs: 5, md: 8 } }}>
        <PageHeader title={title} backTo="/" />
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
            <ConstructionRoundedIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h5" component="h2" sx={{ fontWeight: 750 }}>
              Coming in the next UI slice
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5 }}>
              This page is included in the frontend plan and will be implemented in the
              next UI slice.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
