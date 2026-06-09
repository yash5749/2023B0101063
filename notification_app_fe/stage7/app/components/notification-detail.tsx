"use client";

import {
  Box,
  Button,
  Chip,
  Drawer,
  Stack,
  Typography
} from "@mui/material";
import { formatTimestamp } from "@/lib/notifications";
import type { NormalizedNotification } from "@/lib/types";

export function NotificationDetail({
  item,
  open,
  onClose
}: {
  item: NormalizedNotification | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: 320, sm: 420 }, p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="start">
          <Stack spacing={1}>
            <Chip label={item?.type ?? "Notification"} color="primary" />
            <Typography variant="h5" fontWeight={800}>
              {item?.title ?? "Notification"}
            </Typography>
          </Stack>
          <Button onClick={onClose} variant="text">
            Close
          </Button>
        </Stack>

        <Stack spacing={2} sx={{ mt: 3 }}>
          <Typography variant="body1">{item?.message}</Typography>
          <Typography variant="body2" color="text.secondary">
            {item ? formatTimestamp(item.timestamp) : ""}
          </Typography>
          <Chip
            label={item?.isRead ? "Viewed" : "Unviewed"}
            color={item?.isRead ? "default" : "success"}
            variant="outlined"
            sx={{ alignSelf: "flex-start" }}
          />
        </Stack>
      </Box>
    </Drawer>
  );
}
