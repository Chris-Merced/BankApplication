import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
import { Link } from 'react-router';
import type { PublicUser } from '../api';

interface AppHeaderProps {
  user: PublicUser;
  onLogout: () => void;
}

export default function AppHeader({ user, onLogout }: AppHeaderProps) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, sm: 72 } }}>
          <Button
            component={Link}
            to="/"
            color="inherit"
            startIcon={<AccountBalanceRoundedIcon color="primary" />}
            sx={{ px: 0.5, fontSize: '1.25rem', fontWeight: 800 }}
          >
            Simple Bank
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: 'none', sm: 'block' }, mr: 2, textAlign: 'right' }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
          {user.role === 'admin' && (
            <Button
              component={Link}
              to="/admin"
              color="inherit"
              startIcon={<AdminPanelSettingsRoundedIcon />}
              sx={{ mr: 1 }}
            >
              Admin
            </Button>
          )}
          <Button
            color="inherit"
            startIcon={<LogoutRoundedIcon />}
            onClick={onLogout}
          >
            Log out
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
