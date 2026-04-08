import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";

interface Props {
  message: string;
  action?: ReactNode;
}

export default function EmptyState({ message, action }: Props) {
  return (
    <Box
      sx={{
        py: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <InboxIcon sx={{ fontSize: 40, color: "text.disabled" }} />
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {message}
      </Typography>
      {action}
    </Box>
  );
}
