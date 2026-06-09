"use client";

import {
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography
} from "@mui/material";
import { formatTimestamp } from "@/lib/notifications";
import type { NormalizedNotification } from "@/lib/types";

export function NotificationCard({
  item,
  onOpen,
  viewed
}: {
  item: NormalizedNotification;
  onOpen: (item: NormalizedNotification) => void;
  viewed: boolean;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: viewed ? "divider" : "primary.main",
        backgroundColor: viewed ? "background.paper" : "#edf4ff"
      }}
    >
      <CardActionArea onClick={() => onOpen(item)}>
        <CardContent>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                label={item.type}
                color="primary"
                variant="outlined"
              />
              {!viewed ? <Chip size="small" label="New" color="success" /> : null}
            </Stack>
            <Typography variant="h6" fontWeight={700}>
              {item.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.message}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTimestamp(item.timestamp)}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
