import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import {
  AppBar,
  Box,
  Button,
  Container,
  Toolbar,
  Typography,
} from '@mui/material';
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
          <AccountBalanceRoundedIcon color="primary" sx={{ mr: 1.25 }} />
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}
          >
            Simple Bank
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: 'none', sm: 'block' }, mr: 2, textAlign: 'right' }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
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
