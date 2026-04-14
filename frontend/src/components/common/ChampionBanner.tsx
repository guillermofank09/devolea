import { Box, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import type { Pair } from "../../types/Tournament";

interface Props {
  champion: Pair;
  sex?: string | null;
}

export default function ChampionBanner({ champion, sex }: Props) {
  const title = sex === "FEMENINO" ? "Campeonas" : "Campeones";

  return (
    <Box
      sx={{
        animation: "cbFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "@keyframes cbFadeUp": {
          from: { opacity: 0, transform: "translateY(20px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          px: 3,
          py: 3,
          borderRadius: 3,
          bgcolor: "#fffbeb",
          border: "2px solid #F5AD27",
          overflow: "hidden",
          animation: "cbBorderPulse 2.4s ease-in-out infinite",
          "@keyframes cbBorderPulse": {
            "0%, 100%": { boxShadow: "0 0 0 3px rgba(245,173,39,0.10), 0 4px 16px rgba(245,173,39,0.12)" },
            "50%":       { boxShadow: "0 0 0 6px rgba(245,173,39,0.18), 0 4px 24px rgba(245,173,39,0.22)" },
          },
          // shimmer sweep
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: "linear-gradient(105deg, transparent 35%, rgba(245,173,39,0.18) 50%, transparent 65%)",
            backgroundSize: "200% 100%",
            animation: "cbShimmer 3s linear infinite",
            pointerEvents: "none",
          },
          "@keyframes cbShimmer": {
            "0%":   { backgroundPosition: "200% 0" },
            "100%": { backgroundPosition: "-200% 0" },
          },
        }}
      >
        {/* Trophy */}
        <Box
          sx={{
            zIndex: 1,
            animation: "cbFloat 2s ease-in-out infinite alternate",
            "@keyframes cbFloat": {
              from: { transform: "translateY(0) scale(1)" },
              to:   { transform: "translateY(-6px) scale(1.06)" },
            },
          }}
        >
          <EmojiEventsIcon
            sx={{
              fontSize: { xs: 52, md: 60 },
              color: "#F5AD27",
              filter: "drop-shadow(0 2px 8px rgba(245,173,39,0.55))",
            }}
          />
        </Box>

        {/* Title */}
        <Typography
          sx={{
            zIndex: 1,
            fontSize: { xs: "1.65rem", md: "1.9rem" },
            fontWeight: 900,
            lineHeight: 1,
            color: "#111",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </Typography>

        {/* "del torneo" */}
        <Typography
          sx={{
            zIndex: 1,
            fontSize: "0.6rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            color: "text.disabled",
          }}
        >
          del torneo
        </Typography>

        {/* Divider */}
        <Box sx={{ zIndex: 1, width: 40, height: 2, borderRadius: 1, bgcolor: "#F5AD27", mt: 0.25 }} />

        {/* Player names */}
        <Typography
          sx={{
            zIndex: 1,
            fontSize: { xs: "0.85rem", md: "0.9rem" },
            fontWeight: 700,
            color: "text.secondary",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {champion.player1.name}
          <Box component="span" sx={{ mx: 0.75, color: "#F5AD27", fontWeight: 900 }}>/</Box>
          {champion.player2.name}
        </Typography>
      </Box>
    </Box>
  );
}
