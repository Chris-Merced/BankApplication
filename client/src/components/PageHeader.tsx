import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Box, Button, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

interface PageHeaderProps {
  title: string;
  description?: string;
  backTo?: string;
  action?: ReactNode;
  component?: 'h1' | 'h2';
}

export default function PageHeader({
  title,
  description,
  backTo,
  action,
  component = 'h1',
}: PageHeaderProps) {
  return (
    <Box sx={{ mb: 2.5 }}>
      {backTo && (
        <Button
          component={Link}
          to={backTo}
          color="inherit"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ mb: 1 }}
        >
          Back
        </Button>
      )}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h2" component={component}>
            {title}
          </Typography>
          {description && (
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              {description}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
    </Box>
  );
}
