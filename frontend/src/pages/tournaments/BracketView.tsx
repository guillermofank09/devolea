import { Box, Paper, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import type { TournamentMatch, Pair } from "../../types/Tournament";

const MATCH_H = 84;   // height of each match card
const MATCH_W = 220;  // width of each match card
const CONN_W = 56;    // width of connector area between columns
const GAP_1 = 16;     // gap between match cards in round 1
const STROKE = "#d0d0d0";

interface Props {
  matches: TournamentMatch[];
  onEditMatch: (m: TournamentMatch) => void;
}

function pairShortLabel(pair: Pair | null | undefined): string {
  if (!pair) return "BYE";
  const p1 = pair.player1.name.split(" ")[0];
  const p2 = pair.player2.name.split(" ")[0];
  return `${p1} / ${p2}`;
}

function getRoundLabel(roundNumber: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNumber;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinales";
  if (fromEnd === 2) return "Cuartos";
  return `Ronda ${roundNumber}`;
}

export default function BracketView({ matches, onEditMatch }: Props) {
  // Group matches by round
  const matchesByRound: Record<number, TournamentMatch[]> = {};
  matches.forEach(m => {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
    matchesByRound[m.round].push(m);
  });

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  if (!rounds.length) return null;

  const totalRounds = rounds.length;

  // Compute vertical center Y for every match using a position map.
  // Round 1 matches are evenly spaced; subsequent round centers are the
  // average of their two feeding matches (handles odd counts / BYEs correctly).
  const posMap = new Map<string, number>();
  const span0 = MATCH_H + GAP_1;

  matchesByRound[rounds[0]].forEach((_, i) => {
    posMap.set(`${rounds[0]}-${i}`, MATCH_H / 2 + i * span0);
  });

  for (let rIdx = 1; rIdx < rounds.length; rIdx++) {
    const prev = rounds[rIdx - 1];
    const curr = rounds[rIdx];
    matchesByRound[curr].forEach((_, i) => {
      const cy1 = posMap.get(`${prev}-${2 * i}`) ?? 0;
      const cy2 = posMap.get(`${prev}-${2 * i + 1}`);
      posMap.set(`${curr}-${i}`, cy2 != null ? (cy1 + cy2) / 2 : cy1);
    });
  }

  const allCenters = Array.from(posMap.values());
  const totalH = Math.max(...allCenters) + MATCH_H / 2;
  const totalW = rounds.length * MATCH_W + (rounds.length - 1) * CONN_W;

  // Build SVG connector lines between rounds
  const connectors: React.ReactNode[] = [];

  rounds.forEach((round, rIdx) => {
    if (rIdx >= totalRounds - 1) return;
    const nextRound = rounds[rIdx + 1];
    const roundMatches = matchesByRound[round];
    const x1 = rIdx * (MATCH_W + CONN_W) + MATCH_W;
    const xMid = x1 + CONN_W / 2;
    const x2 = x1 + CONN_W;

    for (let i = 0; i < roundMatches.length; i += 2) {
      const cy1 = posMap.get(`${round}-${i}`)!;
      const cyNext = posMap.get(`${nextRound}-${Math.floor(i / 2)}`)!;

      // Horizontal: right edge of match i → midpoint
      connectors.push(
        <line key={`ha-${round}-${i}`}
          x1={x1} y1={cy1} x2={xMid} y2={cy1}
          stroke={STROKE} strokeWidth={1.5} strokeLinecap="round"
        />
      );

      if (i + 1 < roundMatches.length) {
        const cy2 = posMap.get(`${round}-${i + 1}`)!;
        const cyMid = (cy1 + cy2) / 2;
        connectors.push(
          // Horizontal: right edge of match i+1 → midpoint
          <line key={`ha-${round}-${i + 1}`}
            x1={x1} y1={cy2} x2={xMid} y2={cy2}
            stroke={STROKE} strokeWidth={1.5} strokeLinecap="round"
          />,
          // Vertical: connecting the two horizontals
          <line key={`v-${round}-${i}`}
            x1={xMid} y1={cy1} x2={xMid} y2={cy2}
            stroke={STROKE} strokeWidth={1.5} strokeLinecap="round"
          />,
          // Horizontal: midpoint → left edge of next round match
          <line key={`hb-${round}-${i}`}
            x1={xMid} y1={cyMid} x2={x2} y2={cyNext}
            stroke={STROKE} strokeWidth={1.5} strokeLinecap="round"
          />
        );
      } else {
        // Odd match (BYE advances alone): straight line to next round
        connectors.push(
          <line key={`hb-${round}-${i}`}
            x1={xMid} y1={cy1} x2={x2} y2={cyNext}
            stroke={STROKE} strokeWidth={1.5} strokeLinecap="round"
          />
        );
      }
    }
  });

  // Detect champion (last round has 1 match with a winner)
  const lastRound = rounds[rounds.length - 1];
  const finalMatch = matchesByRound[lastRound];
  let champion: Pair | null = null;
  if (finalMatch.length === 1 && finalMatch[0].winnerId != null) {
    const fm = finalMatch[0];
    champion = fm.pair1?.id === fm.winnerId ? (fm.pair1 ?? null) : (fm.pair2 ?? null);
  }

  return (
    <Box sx={{ overflowX: "auto", overflowY: "visible", pb: 2, WebkitOverflowScrolling: "touch", maxWidth: "100%" }}>
      {/* Round column headers */}
      <Box sx={{ display: "flex", mb: 2, minWidth: totalW }}>
        {rounds.map((round, rIdx) => (
          <Box
            key={round}
            sx={{
              width: MATCH_W,
              flexShrink: 0,
              textAlign: "center",
              mr: rIdx < rounds.length - 1 ? `${CONN_W}px` : 0,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={800}
              color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: 1.2, fontSize: "0.68rem" }}
            >
              {getRoundLabel(round, totalRounds)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Bracket canvas */}
      <Box sx={{ position: "relative", width: totalW, height: totalH, minWidth: totalW }}>
        {/* SVG connector lines */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: totalW,
            height: totalH,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          {connectors}
        </svg>

        {/* Match cards */}
        {rounds.map((round, rIdx) =>
          matchesByRound[round].map((match, mIdx) => {
            const cy = posMap.get(`${round}-${mIdx}`)!;
            return (
              <Box
                key={match.id}
                sx={{
                  position: "absolute",
                  top: cy - MATCH_H / 2,
                  left: rIdx * (MATCH_W + CONN_W),
                  width: MATCH_W,
                  height: MATCH_H,
                }}
              >
                <BracketMatchCard match={match} onEdit={() => onEditMatch(match)} />
              </Box>
            );
          })
        )}
      </Box>

      {/* Champion banner */}
      {champion && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              px: 3,
              py: 1.5,
              bgcolor: "#fffbeb",
              border: "2px solid #f59e0b",
              borderRadius: 3,
            }}
          >
            <EmojiEventsIcon sx={{ color: "#f59e0b", fontSize: 36 }} />
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                sx={{ textTransform: "uppercase", letterSpacing: 1.2, display: "block" }}
              >
                Campeón del Torneo
              </Typography>
              <Typography variant="subtitle1" fontWeight={800} lineHeight={1.3}>
                {champion.player1.name} / {champion.player2.name}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Match card

function BracketMatchCard({ match, onEdit }: { match: TournamentMatch; onEdit: () => void }) {
  const isBye = match.status === "BYE";
  const isCompleted = match.status === "COMPLETED";
  const pair1Won = match.winnerId != null && match.pair1?.id === match.winnerId;
  const pair2Won = match.winnerId != null && match.pair2?.id === match.winnerId;

  const sideColor = isBye ? "#90caf9" : isCompleted ? "#66bb6a" : "#e0e0e0";

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        height: "100%",
        border: "1.5px solid",
        borderColor: isCompleted ? "#c8e6c9" : "divider",
        borderRadius: 2,
        overflow: "hidden",
        display: "flex",
        cursor: !isBye ? "pointer" : "default",
        userSelect: "none",
        transition: "box-shadow 0.15s, border-color 0.15s",
        "&:hover": !isBye ? { boxShadow: "0 2px 10px rgba(0,0,0,0.13)", borderColor: "#aaa" } : {},
      }}
      onClick={!isBye ? onEdit : undefined}
    >
      {/* Status colour bar */}
      <Box sx={{ width: 4, flexShrink: 0, bgcolor: sideColor }} />

      {/* Content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <PairRow
          label={pairShortLabel(match.pair1)}
          isWinner={pair1Won}
          isLoser={pair2Won}
          isBye={!match.pair1}
        />
        <Box sx={{ height: "1px", bgcolor: "divider", flexShrink: 0 }} />
        <PairRow
          label={pairShortLabel(match.pair2)}
          isWinner={pair2Won}
          isLoser={pair1Won}
          isBye={!match.pair2}
        />
        {/* Result row — always reserved so card height stays fixed */}
        <Box sx={{ height: "1px", bgcolor: "divider", flexShrink: 0 }} />
        <Box
          sx={{
            flexShrink: 0,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "grey.50",
            px: 1,
          }}
        >
          {match.result && (
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{ fontSize: "0.62rem", letterSpacing: 0.3 }}
            >
              {match.result}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single pair row inside a match card

function PairRow({
  label,
  isWinner,
  isLoser,
  isBye,
}: {
  label: string;
  isWinner: boolean;
  isLoser: boolean;
  isBye: boolean;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        px: 1,
        gap: 0.5,
        bgcolor: isWinner ? "rgba(76,175,80,0.10)" : "transparent",
        minWidth: 0,
      }}
    >
      {isWinner ? (
        <EmojiEventsIcon sx={{ fontSize: 11, color: "#f59e0b", flexShrink: 0 }} />
      ) : (
        <Box sx={{ width: 11, flexShrink: 0 }} />
      )}
      <Typography
        variant="caption"
        noWrap
        sx={{
          flex: 1,
          fontSize: "0.7rem",
          fontWeight: isWinner ? 700 : 400,
          color: isBye ? "text.disabled" : isLoser ? "text.disabled" : "text.primary",
          letterSpacing: 0.1,
          minWidth: 0,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
