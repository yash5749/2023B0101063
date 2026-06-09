"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1f5fbf"
    },
    background: {
      default: "#f5f7fb"
    }
  },
  shape: {
    borderRadius: 14
  },
  typography: {
    fontFamily: [
      "Inter",
      "Arial",
      "Helvetica",
      "sans-serif"
    ].join(",")
  }
});

export function ThemeRegistry({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
