"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
  ThemeProvider,
  createTheme,
  CssBaseline
} from "@mui/material";
import { fetchNotifications } from "@/lib/api";
import {
  filterByType,
  normalizeNotification,
  sortNotifications,
  typeOptions
} from "@/lib/notifications";
import type { NormalizedNotification } from "@/lib/types";
import { loadViewedIds, saveViewedIds } from "@/lib/viewed-state";
import { NotificationCard } from "./notification-card";
import { NotificationDetail } from "./notification-detail";
import { PageShell } from "./page-shell";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1f5fbf"
    },
    background: {
      default: "#f5f7fb"
    }
  }
});

const DEFAULT_LIMIT = 10;

export function NotificationsPage({
  title,
  subtitle,
  mode
}: {
  title: string;
  subtitle: string;
  mode: "all" | "priority";
}) {
  const [userId, setUserId] = useState("stu_101");
  const [items, setItems] = useState<NormalizedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [page, setPage] = useState(1);
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [activeItem, setActiveItem] = useState<NormalizedNotification | null>(null);

  useEffect(() => {
    const savedUserId = window.localStorage.getItem("stage7:userId");
    if (savedUserId) {
      setUserId(savedUserId);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("stage7:userId", userId);
    setViewedIds(loadViewedIds(userId));
  }, [userId]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const raw = await fetchNotifications({
          userId,
          limit: mode === "priority" ? limit : 50,
          page,
          notificationType: mode === "priority" ? selectedType : undefined
        });

        if (!isMounted) return;

        const normalized = sortNotifications(
          raw.map((item) => normalizeNotification(item))
        );
        setItems(normalized);
      } catch (fetchError) {
        if (!isMounted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to fetch notifications"
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [userId, limit, page, selectedType, mode]);

  const visibleItems = useMemo(() => {
    const filtered =
      mode === "priority"
        ? items.filter((item) => selectedType === "All" || item.type === selectedType)
        : items;
    return filtered;
  }, [items, mode, selectedType]);

  const unreadCount = visibleItems.filter(
    (item) => !viewedIds.has(item.id)
  ).length;

  const markViewed = (item: NormalizedNotification) => {
    const next = new Set(viewedIds);
    next.add(item.id);
    setViewedIds(next);
    saveViewedIds(userId, next);
    setActiveItem(item);
  };

  const content = (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Typography variant="h3" fontWeight={900}>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {subtitle}
        </Typography>
      </Stack>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ minWidth: 260, flex: "1 1 320px" }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Active user:
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {userId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Unviewed: {unreadCount}
                </Typography>
              </Stack>
            </Box>

            {mode === "priority" && (
              <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", alignItems: "center" }}>
                <Box sx={{ minWidth: 180, flex: "1 1 180px" }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      label="Type"
                      value={selectedType}
                      onChange={(event) => setSelectedType(event.target.value)}
                    >
                      {typeOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ minWidth: 120, flex: "0 1 140px" }}>
                  <TextField
                    label="Top n"
                    type="number"
                    size="small"
                    fullWidth
                    value={limit}
                    inputProps={{ min: 1, max: 10 }}
                    onChange={(event) =>
                      setLimit(Math.max(1, Math.min(10, Number(event.target.value) || 1)))
                    }
                  />
                </Box>
              </Stack>
            )}
          </Box>
        </CardContent>
      </Card>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : visibleItems.length === 0 ? (
        <Alert severity="info">No notifications found.</Alert>
      ) : (
        <Stack spacing={2}>
          {visibleItems.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onOpen={markViewed}
              viewed={viewedIds.has(item.id)}
            />
          ))}
        </Stack>
      )}

      {mode === "priority" && (
        <Stack alignItems="center">
          <Pagination
            page={page}
            count={5}
            color="primary"
            onChange={(_, nextPage) => setPage(nextPage)}
          />
        </Stack>
      )}

      <NotificationDetail
        item={activeItem}
        open={Boolean(activeItem)}
        onClose={() => setActiveItem(null)}
      />
    </Stack>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PageShell userId={userId} onUserIdChange={setUserId}>
        {content}
      </PageShell>
    </ThemeProvider>
  );
}
