"use client";

import { useEffect } from "react";
import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        <Stack spacing={3} alignItems="center">
          <Typography variant="h4" fontWeight={700}>
            Something went wrong
          </Typography>
          <Alert severity="error">{error.message}</Alert>
          <Button variant="contained" onClick={() => reset()}>
            Try again
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
