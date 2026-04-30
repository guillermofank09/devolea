import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  stackOnMobile?: boolean;
}

export default function PageHeader({ title, subtitle, action, stackOnMobile }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: stackOnMobile ? { xs: "flex-start", sm: "center" } : "center",
        flexDirection: stackOnMobile ? { xs: "column", sm: "row" } : "row",
        justifyContent: "space-between",
        gap: 2,
        mb: 4,
        pb: 3,
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "stretch", gap: 2, minWidth: 0, flex: 1 }}>
        <Box
          sx={{
            width: 4,
            borderRadius: 2,
            backgroundColor: "#F5AD27",
            flexShrink: 0,
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: "1.6rem", sm: "2rem" },
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
              color: "text.primary",
              textTransform: "uppercase",
              whiteSpace: stackOnMobile ? { xs: "normal", sm: "nowrap" } : "nowrap",
              overflow: stackOnMobile ? { xs: "visible", sm: "hidden" } : "hidden",
              textOverflow: stackOnMobile ? { xs: "unset", sm: "ellipsis" } : "ellipsis",
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
