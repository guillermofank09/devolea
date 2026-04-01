import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mb: 4,
        pb: 3,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "stretch", gap: 2 }}>
        <Box
          sx={{
            width: 4,
            borderRadius: 2,
            backgroundColor: "#F5AD27",
            flexShrink: 0,
          }}
        />
        <Box>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "1.6rem", sm: "2rem" },
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
              color: "text.primary",
              fontFamily: "'Teko', sans-serif",
              textTransform: "uppercase",
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {action && (
        <Box sx={{ flexShrink: 0 }}>
          {action}
        </Box>
      )}
    </Box>
  );
}
