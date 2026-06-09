"use client";

import {
  AppBar,
  Box,
  Button,
  Container,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Typography
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "All notifications", href: "/" },
  { label: "Priority view", href: "/priority" }
];

export function PageShell({
  children,
  userId,
  onUserIdChange
}: {
  children: React.ReactNode;
  userId: string;
  onUserIdChange: (value: string) => void;
}) {
  const pathname = usePathname();

  return (
    <Box>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
          <Typography variant="h6" fontWeight={800} sx={{ mr: 2 }}>
            Notification Center
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flex: 1, flexWrap: "wrap" }}>
            {navItems.map((item) => (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                color={pathname === item.href ? "secondary" : "inherit"}
                variant={pathname === item.href ? "contained" : "text"}
                sx={{ color: pathname === item.href ? "white" : "inherit" }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
          <TextField
            select
            size="small"
            value={userId}
            onChange={(event) => onUserIdChange(event.target.value)}
            sx={{ width: 180, backgroundColor: "white", borderRadius: 1 }}
            label="Active user"
          >
            {["stu_101", "stu_102", "stu_103", "guest_user"].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
