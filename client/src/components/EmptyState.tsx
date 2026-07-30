import { Box, Card, CardContent, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
        {icon && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            {icon}
          </Box>
        )}
        <Typography variant="h5" component="h3" sx={{ fontWeight: 750 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75, mb: action ? 2.5 : 0 }}>
          {description}
        </Typography>
        {action}
      </CardContent>
    </Card>
  );
}
