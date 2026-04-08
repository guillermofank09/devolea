import { Box, Skeleton, Paper } from "@mui/material";

interface Props {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({ rows = 6, columns = 4 }: Props) {
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: "1.5px solid", borderColor: "divider", overflow: "hidden" }}>
      {/* Header row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 2,
          px: 2,
          py: 1.5,
          bgcolor: "#f5f5f5",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width="60%" height={18} />
        ))}
      </Box>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <Box
          key={rowIdx}
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 2,
            px: 2,
            py: 1.5,
            borderBottom: rowIdx < rows - 1 ? "1px solid" : "none",
            borderColor: "divider",
            alignItems: "center",
          }}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Box key={colIdx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {colIdx === 0 && (
                <Skeleton variant="circular" width={36} height={36} sx={{ flexShrink: 0 }} />
              )}
              <Skeleton variant="text" width={colIdx === 0 ? "70%" : "50%"} height={16} />
            </Box>
          ))}
        </Box>
      ))}
    </Paper>
  );
}
