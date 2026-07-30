import { Card, CardContent, CircularProgress, Typography } from '@mui/material';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = 'Loading…',
}: LoadingStateProps) {
  return (
    <Card role="status" aria-live="polite">
      <CardContent
        sx={{
          p: 5,
          display: 'grid',
          justifyItems: 'center',
          gap: 1.5,
        }}
      >
        <CircularProgress aria-hidden="true" />
        <Typography color="text.secondary">{message}</Typography>
      </CardContent>
    </Card>
  );
}
