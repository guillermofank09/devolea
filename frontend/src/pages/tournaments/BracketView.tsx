import { Box, Paper, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import type { TournamentMatch, Pair } from "../../types/Tournament";
import ChampionBanner from "../../components/common/ChampionBanner";

const MATCH_H = 84;
const MATCH_W = 220;
const CONN_W = 56;
const GAP_1 = 16;
const STROKE = "#d0d0d0";

interface Props {
  matches: TournamentMatch[];
  onEditMatch: (m: TournamentMatch) => void;
  onVirtualMatchClick: (round: number, matchNumber: number) => void;
  sex?: string | null;
}

// Virtual slot: a future match that has no DB record yet
interface VirtualSlot {
  virtual: true;
  round: number;
  matchNumber: number; // 1-based
}

type AnySlot = TournamentMatch | VirtualSlot;

function isVirtual(s: AnySlot): s is VirtualSlot {
  return (s as VirtualSlot).virtual === true;
}

function isPlaceholder(m: TournamentMatch): boolean {
  return m.pair1 === null && m.pair2 === null && m.status === "PENDING";
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
  if (fromEnd === 2) return "Cuartos de final";
  if (fromEnd === 3) return "Octavos de final";
  return `Ronda ${roundNumber}`;
}

export default function BracketView({ matches, onEditMatch, onVirtualMatchClick, sex }: Props) {
  // Group real matches by round
  const matchesByRound: Record<number, TournamentMatch[]> = {};
  matches.forEach(m => {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
    matchesByRound[m.round].push(m);
  });

  const generatedRounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  if (!generatedRounds.length) return null;

  // Calculate the full expected bracket structure from round 1 count
  const round1Count = matchesByRound[generatedRounds[0]].length;
  const allRoundCounts: number[] = [round1Count];
  let remaining = round1Count;
  while (remaining > 1) {
    remaining = Math.ceil(remaining / 2);
    allRoundCounts.push(remaining);
  }
  const totalRoundsExpected = allRoundCounts.length;
  const allRoundNumbers = Array.from({ length: totalRoundsExpected }, (_, i) => i + 1);

  // Build unified slot map: real DB matches OR virtual placeholders for missing rounds
  const unifiedByRound: Record<number, AnySlot[]> = {};
  allRoundNumbers.forEach((roundNum, rIdx) => {
    if (matchesByRound[roundNum]) {
      unifiedByRound[roundNum] = matchesByRound[roundNum];
    } else {
      unifiedByRound[roundNum] = Array.from({ length: allRoundCounts[rIdx] }, (_, i) => ({
        virtual: true as const,
        round: roundNum,
        matchNumber: i + 1,
      }));
    }
  });

  // Compute vertical center Y for every slot
  const posMap = new Map<string, number>();
  const span0 = MATCH_H + GAP_1;

  unifiedByRound[1].forEach((_, i) => {
    posMap.set(`1-${i}`, MATCH_H / 2 + i * span0);
  });

  for (let rIdx = 1; rIdx < allRoundNumbers.length; rIdx++) {
    const prev = allRoundNumbers[rIdx - 1];
    const curr = allRoundNumbers[rIdx];
    unifiedByRound[curr].forEach((_, i) => {
      const cy1 = posMap.get(`${prev}-${2 * i}`) ?? 0;
      const cy2 = posMap.get(`${prev}-${2 * i + 1}`);
      posMap.set(`${curr}-${i}`, cy2 != null ? (cy1 + cy2) / 2 : cy1);
    });
  }

  const allCenters = Array.from(posMap.values());
  const totalH = Math.max(...allCenters) + MATCH_H / 2;
  const totalW = totalRoundsExpected * MATCH_W + (totalRoundsExpected - 1) * CONN_W;

  // Build SVG connector lines across all rounds
  const connectors: React.ReactNode[] = [];
  allRoundNumbers.forEach((round, rIdx) => {
    if (rIdx >= totalRoundsExpected - 1) return;
    const nextRound = allRoundNumbers[rIdx + 1];
    const roundSlots = unifiedByRound[round];
    const x1 = rIdx * (MATCH_W + CONN_W) + MATCH_W;
    const xMid = x1 + CONN_W / 2;
    const x2 = x1 + CONN_W;

    for (let i = 0; i < roundSlots.length; i += 2) {
      const cy1 = posMap.get(`${round}-${i}`)!;
      const cyNext = posMap.get(`${nextRound}-${Math.floor(i / 2)}`)!;

      connectors.push(
        <line key={`ha-${round}-${i}`}
          x1={x1} y1={cy1} x2={xMid} y2={cy1}
          stroke={STROKE} strokeWidth={1.5} strokeLinecap="round"
        />
      );

      if (i + 1 < roundSlots.length) {
        const cy2 = posMap.get(`${round}-${i + 1}`)!;
        const cyMid = (cy1 + cy2) / 2;
        connectors.push(
          <line key={`ha-${round}-${i + 1}`}
            x1={x1} y1={cy2} x2={xMid} y2={cy2}
            stroke={STROKE} strokeWidth={1.5} strokeLinecap="round"
          />,
          <line key={`v-${round}-${i}`}
            x1={xMid} y1={cy1} x2={xMid} y2={cy2}
            stroke={STROKE} strokeWidth={1.5} strokeLinecap="round"
          />,
          <line key={`hb-${round}-${i}`}
            x1={xMid} y1={cyMid} x2={x2} y2={cyNext}
            stroke={STROKE} strokeWidth={1.5} strokeLinecap="round"
          />
        );
      } else {
        connectors.push(
          <line key={`hb-${round}-${i}`}
            x1={xMid} y1={cy1} x2={x2} y2={cyNext}
            stroke={STROKE} strokeWidth={1.5} strokeLinecap="round"
          />
        );
      }
    }
  });

  // Detect champion
  const lastRealRound = generatedRounds[generatedRounds.length - 1];
  const finalMatches = matchesByRound[lastRealRound];
  let champion: Pair | null = null;
  if (
    lastRealRound === totalRoundsExpected &&
    finalMatches?.length === 1 &&
    finalMatches[0].winnerId != null
  ) {
    const fm = finalMatches[0];
    champion = fm.pair1?.id === fm.winnerId ? (fm.pair1 ?? null) : (fm.pair2 ?? null);
  }

  return (
    <Box sx={{ width: "100%", overflowX: "auto", pb: 2, WebkitOverflowScrolling: "touch" }}>
      {/* Round column headers */}
      <Box sx={{ display: "flex", mb: 2, minWidth: totalW }}>
        {allRoundNumbers.map((round, rIdx) => (
          <Box
            key={round}
            sx={{
              width: MATCH_W, flexShrink: 0, textAlign: "center",
              mr: rIdx < allRoundNumbers.length - 1 ? `${CONN_W}px` : 0,
            }}
          >
            <Typography
              variant="caption" fontWeight={800} color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: 1.2, fontSize: "0.68rem" }}
            >
              {getRoundLabel(round, totalRoundsExpected)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Bracket canvas */}
      <Box sx={{ position: "relative", width: totalW, height: totalH, minWidth: totalW }}>
        <svg style={{ position: "absolute", top: 0, left: 0, width: totalW, height: totalH, pointerEvents: "none", overflow: "visible" }}>
          {connectors}
        </svg>

        {allRoundNumbers.map((round, rIdx) =>
          unifiedByRound[round].map((slot, mIdx) => {
            const cy = posMap.get(`${round}-${mIdx}`)!;
            return (
              <Box
                key={isVirtual(slot) ? `v-${round}-${mIdx}` : slot.id}
                sx={{
                  position: "absolute",
                  top: cy - MATCH_H / 2,
                  left: rIdx * (MATCH_W + CONN_W),
                  width: MATCH_W,
                  height: MATCH_H,
                }}
              >
                {isVirtual(slot) ? (
                  <PlaceholderCard
                    onClick={() => onVirtualMatchClick(slot.round, slot.matchNumber)}
                  />
                ) : isPlaceholder(slot) ? (
                  <PlaceholderCard
                    scheduledAt={slot.scheduledAt ?? undefined}
                    courtName={slot.court?.name}
                    onClick={() => onEditMatch(slot)}
                  />
                ) : (
                  <BracketMatchCard match={slot} onEdit={() => onEditMatch(slot)} />
                )}
              </Box>
            );
          })
        )}
      </Box>

      {/* Champion banner */}
      {champion && <ChampionBanner champion={champion} sex={sex} />}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Placeholder card (virtual frontend slot OR DB placeholder with no pairs yet)

function PlaceholderCard({
  scheduledAt,
  courtName,
  onClick,
}: {
  scheduledAt?: string;
  courtName?: string;
  onClick: () => void;
}) {
  const hasSchedule = !!scheduledAt;
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        width: "100%", height: "100%",
        border: "1.5px dashed",
        borderColor: hasSchedule ? "primary.light" : "divider",
        borderRadius: 2, overflow: "hidden",
        display: "flex", cursor: "pointer",
        opacity: hasSchedule ? 0.75 : 0.5,
        transition: "opacity 0.15s, box-shadow 0.15s",
        "&:hover": { opacity: 1, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" },
      }}
    >
      <Box sx={{ width: 4, flexShrink: 0, bgcolor: hasSchedule ? "primary.light" : "#e0e0e0" }} />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 1.5 }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.7rem" }}>
            A definir
          </Typography>
        </Box>
        <Box sx={{ height: "1px", bgcolor: "divider", flexShrink: 0 }} />
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 1.5 }}>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.7rem" }}>
            A definir
          </Typography>
        </Box>
        <Box sx={{ height: "1px", bgcolor: "divider", flexShrink: 0 }} />
        <Box sx={{ flexShrink: 0, height: 16, display: "flex", alignItems: "center", justifyContent: "center", px: 1, bgcolor: "grey.50", gap: 0.5 }}>
          {hasSchedule ? (
            <Typography variant="caption" color="primary.main" sx={{ fontSize: "0.6rem", fontWeight: 700 }}>
              {new Date(scheduledAt!).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              {courtName ? ` · ${courtName}` : ""}
            </Typography>
          ) : (
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem" }}>
              Toque para programar
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Real match card

const LIVE_STATUS_COLORS: Record<string, { stripe: string; border: string; bg: string; text: string; label: string }> = {
  IN_PLAY: { stripe: "#4caf50", border: "#a5d6a7", bg: "#f1f8f1", text: "#2e7d32", label: "En juego" },
  DELAYED:  { stripe: "#ff9800", border: "#ffcc80", bg: "#fff8f0", text: "#e65100", label: "Atrasado" },
  EARLY:    { stripe: "#29b6f6", border: "#90caf9", bg: "#f0f8ff", text: "#1565c0", label: "Adelantado" },
};

function BracketMatchCard({ match, onEdit }: { match: TournamentMatch; onEdit: () => void }) {
  const isBye = match.status === "BYE";
  const isCompleted = match.status === "COMPLETED";
  const pair1Won = match.winnerId != null && match.pair1?.id === match.winnerId;
  const pair2Won = match.winnerId != null && match.pair2?.id === match.winnerId;
  const live = match.liveStatus ? LIVE_STATUS_COLORS[match.liveStatus] : null;
  const sideColor = live ? live.stripe : isBye ? "#90caf9" : isCompleted ? "#66bb6a" : "#e0e0e0";

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%", height: "100%",
        border: "1.5px solid",
        borderColor: live ? live.border : isCompleted ? "#c8e6c9" : "divider",
        bgcolor: live ? live.bg : "background.paper",
        borderRadius: 2, overflow: "hidden",
        display: "flex",
        cursor: "pointer",
        userSelect: "none",
        transition: "box-shadow 0.15s, border-color 0.15s",
        "&:hover": { boxShadow: "0 2px 10px rgba(0,0,0,0.13)", borderColor: live ? live.stripe : "#aaa" },
      }}
      onClick={onEdit}
    >
      <Box sx={{ width: 4, flexShrink: 0, bgcolor: sideColor }} />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <PairRow label={pairShortLabel(match.pair1)} isWinner={pair1Won} isLoser={pair2Won} isBye={!match.pair1} />
        <Box sx={{ height: "1px", bgcolor: live ? live.border : "divider", flexShrink: 0 }} />
        <PairRow label={pairShortLabel(match.pair2)} isWinner={pair2Won} isLoser={pair1Won} isBye={!match.pair2} />
        <Box sx={{ height: "1px", bgcolor: live ? live.border : "divider", flexShrink: 0 }} />
        <Box sx={{ flexShrink: 0, height: 16, display: "flex", alignItems: "center", justifyContent: "center", px: 1, gap: 0.5, bgcolor: live ? live.bg : "grey.50" }}>
          {match.result ? (
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: "0.62rem", letterSpacing: 0.3 }}>
              {match.result}
            </Typography>
          ) : live ? (
            <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.6rem", color: live.text }}>
              {live.label}
              {match.liveStatus === "DELAYED" && match.delayedUntil
                ? ` · ${new Date(match.delayedUntil).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </Typography>
          ) : match.scheduledAt ? (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem" }}>
              {new Date(match.scheduledAt).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              {match.court?.name ? ` · ${match.court.name}` : ""}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Paper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function PairRow({ label, isWinner, isLoser, isBye }: { label: string; isWinner: boolean; isLoser: boolean; isBye: boolean }) {
  return (
    <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 1, gap: 0.5, bgcolor: isWinner ? "rgba(76,175,80,0.10)" : "transparent", minWidth: 0 }}>
      {isWinner ? (
        <EmojiEventsIcon sx={{ fontSize: 11, color: "#f59e0b", flexShrink: 0 }} />
      ) : (
        <Box sx={{ width: 11, flexShrink: 0 }} />
      )}
      <Typography
        variant="caption" noWrap
        sx={{
          flex: 1, fontSize: "0.7rem",
          fontWeight: isWinner ? 700 : 400,
          color: isBye ? "text.disabled" : isLoser ? "text.disabled" : "text.primary",
          letterSpacing: 0.1, minWidth: 0,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
