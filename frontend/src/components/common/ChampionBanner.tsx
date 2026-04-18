import { Box, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import type { Pair } from "../../types/Tournament";

interface Props {
  champion?: Pair | null;
  championLabel?: string;
  sex?: string | null;
  compact?: boolean;
}

export default function ChampionBanner({ champion, championLabel, sex, compact }: Props) {
  const title = sex === "FEMENINO" ? "Campeonas" : "Campeones";

  return (
    <Box
      sx={{
        width: "100%",
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
          flexDirection: compact ? "row" : "column",
          alignItems: "center",
          justifyContent: compact ? "center" : undefined,
          gap: compact ? 1.5 : 1,
          px: compact ? 2 : 3,
          py: compact ? 1.5 : 3,
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
              fontSize: compact ? 36 : { xs: 52, md: 60 },
              color: "#F5AD27",
              filter: "drop-shadow(0 2px 8px rgba(245,173,39,0.55))",
            }}
          />
        </Box>

        {/* Text group */}
        <Box sx={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: compact ? "flex-start" : "center", gap: 0.4 }}>
          {!compact && (
            <Typography sx={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: "text.disabled" }}>
              del torneo
            </Typography>
          )}

          <Typography
            sx={{
              fontSize: compact ? "1.1rem" : { xs: "1.65rem", md: "1.9rem" },
              fontWeight: 900,
              lineHeight: 1,
              color: "#111",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </Typography>

          {!compact && <Box sx={{ width: 40, height: 2, borderRadius: 1, bgcolor: "#F5AD27", mt: 0.25, mb: 0.25 }} />}

          <Typography
            sx={{
              fontSize: compact ? "0.78rem" : { xs: "0.85rem", md: "0.9rem" },
              fontWeight: 700,
              color: "text.secondary",
              lineHeight: 1.4,
            }}
          >
            {championLabel ?? (
              <>
                {champion?.player1.name}
                <Box component="span" sx={{ mx: 0.5, color: "#F5AD27", fontWeight: 900 }}>/</Box>
                {champion?.player2.name}
              </>
            )}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
