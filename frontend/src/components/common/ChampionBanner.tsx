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
        mt: 4,
        display: "flex",
        justifyContent: "center",
        animation: "fadeSlideUp 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "@keyframes fadeSlideUp": {
          from: { opacity: 0, transform: "translateY(32px) scale(0.97)" },
          to:   { opacity: 1, transform: "translateY(0) scale(1)" },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.25,
          px: { xs: 4, md: 6 },
          py: { xs: 3, md: 3.5 },
          borderRadius: 4,
          background: "linear-gradient(160deg, #111 0%, #1c1400 50%, #111 100%)",
          border: "2px solid #f59e0b",
          animation: "borderPulse 2.2s ease-in-out infinite",
          "@keyframes borderPulse": {
            "0%, 100%": { boxShadow: "0 0 0 4px rgba(245,158,11,0.12), 0 8px 32px rgba(0,0,0,0.45)" },
            "50%":       { boxShadow: "0 0 0 8px rgba(245,158,11,0.24), 0 8px 40px rgba(245,158,11,0.22)" },
          },
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: "linear-gradient(105deg, transparent 35%, rgba(245,158,11,0.12) 50%, transparent 65%)",
            backgroundSize: "200% 100%",
            animation: "shimmerSweep 2.8s linear infinite",
          },
          "@keyframes shimmerSweep": {
            "0%":   { backgroundPosition: "200% 0" },
            "100%": { backgroundPosition: "-200% 0" },
          },
        }}
      >
        {/* Trophy */}
        <Box
          sx={{
            zIndex: 1,
            animation: "trophyFloat 1.9s ease-in-out infinite alternate",
            "@keyframes trophyFloat": {
              from: { transform: "translateY(0) scale(1)" },
              to:   { transform: "translateY(-7px) scale(1.07)" },
            },
          }}
        >
          <EmojiEventsIcon
            sx={{
              fontSize: { xs: 54, md: 68 },
              color: "#f59e0b",
              filter: "drop-shadow(0 0 14px rgba(245,158,11,0.75))",
            }}
          />
        </Box>

        {/* "del torneo" */}
        <Typography
          sx={{
            zIndex: 1,
            fontSize: "0.6rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            color: "rgba(245,158,11,0.65)",
          }}
        >
          del torneo
        </Typography>

        {/* Title */}
        <Typography
          sx={{
            zIndex: 1,
            fontSize: { xs: "1.9rem", md: "2.3rem" },
            fontWeight: 900,
            lineHeight: 1,
            background: "linear-gradient(135deg, #fef3c7 0%, #f59e0b 40%, #fef3c7 70%, #f59e0b 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundSize: "200% auto",
            animation: "goldShimmer 3s linear infinite",
            "@keyframes goldShimmer": {
              "0%":   { backgroundPosition: "0% center" },
              "100%": { backgroundPosition: "200% center" },
            },
          }}
        >
          {title}
        </Typography>

        {/* Player names */}
        <Typography
          sx={{
            zIndex: 1,
            fontSize: { xs: "0.95rem", md: "1.05rem" },
            fontWeight: 700,
            color: "#e8eaf0",
            textAlign: "center",
            letterSpacing: "0.02em",
          }}
        >
          {champion.player1.name} / {champion.player2.name}
        </Typography>
      </Box>
    </Box>
  );
}
