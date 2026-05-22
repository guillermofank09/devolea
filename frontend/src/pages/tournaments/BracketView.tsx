import { Avatar, Box, Button, Paper, Tooltip, Typography } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import type { TournamentMatch, Pair, TournamentTeam } from "../../types/Tournament";
import ChampionBanner from "../../components/common/ChampionBanner";
import { getInitials, stringToColor } from "../../utils/uiUtils";

const MATCH_H = 100;
const MATCH_W = 240;
const CONN_W = 48;
const GAP_1 = 20;
const STROKE = "#cbd5e1"; // Slate 300

interface Props {
  matches: TournamentMatch[];
  onEditMatch?: (m: TournamentMatch) => void;
  onVirtualMatchClick?: (round: number, matchNumber: number) => void;
  onAddMatchToRound?: (round: number) => void;
  onAddNewRound?: (round: number) => void;
  sex?: string | null;
  readOnly?: boolean;
  teamMode?: boolean;
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

function isPlaceholder(m: TournamentMatch, teamMode?: boolean): boolean {
  if (teamMode) return !m.team1 && !m.team2 && m.status === "PENDING";
  return m.pair1 === null && m.pair2 === null && m.status === "PENDING";
}


export function getRoundLabel(roundNumber: number, totalRounds: number, allRoundCounts: number[]): string {
  const hasCrossPhase = allRoundCounts.length >= 2 && allRoundCounts[0] === allRoundCounts[1];
  if (hasCrossPhase) {
    if (roundNumber === 1) return "1ra Ronda";
    if (roundNumber === 2) return "2da Ronda";
  }
  const fromEnd = totalRounds - roundNumber;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinales";
  if (fromEnd === 2) return "Cuartos";
  if (fromEnd === 3) return "Octavos";
  return `Ronda ${roundNumber}`;
}

const ELIMINATION_LABELS = new Set(["Final", "Semifinales", "Cuartos", "Octavos"]);

export default function BracketView({ matches, onEditMatch, onVirtualMatchClick, onAddMatchToRound, onAddNewRound, sex, readOnly = false, teamMode = false }: Props) {
  // Separate RR group matches from regular bracket matches
  const rrR1Matches = matches.filter(m => m.groupTag?.match(/^RR-[A-Z]$/) && m.round === 1);
  const rrR2Matches = matches.filter(m => m.groupTag?.endsWith("-cross"));
  const regularMatches = matches.filter(m => !m.groupTag?.startsWith("RR-"));

  const matchesByRound: Record<number, TournamentMatch[]> = {};
  regularMatches.forEach(m => {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
    matchesByRound[m.round].push(m);
  });

  const generatedRounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  if (!generatedRounds.length && rrR1Matches.length === 0) return null;

  const allRoundNumbers = generatedRounds;
  const allRoundCounts: number[] = allRoundNumbers.map(r => matchesByRound[r].length);
  const totalRoundsExpected = allRoundNumbers.length;

  const hasCrossPhase = allRoundCounts.length >= 2 && allRoundCounts[0] === allRoundCounts[1];
  const r1RealCount = hasCrossPhase
    ? (matchesByRound[allRoundNumbers[0]] ?? []).filter(m => m.status !== "BYE").length
    : 0;

  // >16 total pairs → use groups of 4. Derive total from regular + RR pairs (RR group always = 3 pairs).
  const rrPairCount = rrR1Matches.length > 0 ? 3 : 0;
  const r1ByeCountInRegular = generatedRounds.length > 0 ? (allRoundCounts[0] - r1RealCount) : 0;
  const totalPairs = r1RealCount * 2 + r1ByeCountInRegular + rrPairCount;
  const groupsOf4 = hasCrossPhase && totalPairs > 16;

  const getCrossLabels = (mIdx: number): { pair1Label: string; pair2Label: string } | null => {
    if (groupsOf4) {
      const groupIdx = Math.floor(mIdx / 2);
      const r1B = groupIdx * 2 + 1;
      if (r1B >= r1RealCount) return null;
      const groupLetter = String.fromCharCode(65 + groupIdx);
      return mIdx % 2 === 0
        ? { pair1Label: `G-${groupLetter}1`, pair2Label: `P-${groupLetter}2` }
        : { pair1Label: `G-${groupLetter}2`, pair2Label: `P-${groupLetter}1` };
    }
    const gp = Math.floor(mIdx / 2);
    const r1A = gp * 2;
    const r1B = gp * 2 + 1;
    if (r1B >= r1RealCount) return null;
    const letter = (i: number) => String.fromCharCode(65 + i);
    return mIdx % 2 === 0
      ? { pair1Label: `G-${letter(r1A)}`, pair2Label: `P-${letter(r1B)}` }
      : { pair1Label: `G-${letter(r1B)}`, pair2Label: `P-${letter(r1A)}` };
  };

  const getGroupLabel = (mIdx: number) => groupsOf4
    ? String.fromCharCode(65 + Math.floor(mIdx / 2))
    : String.fromCharCode(65 + mIdx);

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

  const posMap = new Map<string, number>();
  const span0 = MATCH_H + GAP_1;

  unifiedByRound[allRoundNumbers[0]].forEach((_, i) => {
    posMap.set(`${allRoundNumbers[0]}-${i}`, MATCH_H / 2 + i * span0);
  });

  for (let rIdx = 1; rIdx < allRoundNumbers.length; rIdx++) {
    const prev = allRoundNumbers[rIdx - 1];
    const curr = allRoundNumbers[rIdx];
    const prevCount = allRoundCounts[rIdx - 1];
    const currCount = allRoundCounts[rIdx];

    unifiedByRound[curr].forEach((_, i) => {
      if (currCount === prevCount) {
        posMap.set(`${curr}-${i}`, posMap.get(`${prev}-${i}`) ?? 0);
      } else {
        const cy1 = posMap.get(`${prev}-${2 * i}`) ?? 0;
        const cy2 = posMap.get(`${prev}-${2 * i + 1}`);
        posMap.set(`${curr}-${i}`, cy2 != null ? (cy1 + cy2) / 2 : cy1);
      }
    });
  }

  const allCenters = Array.from(posMap.values());
  const totalH = Math.max(...allCenters) + MATCH_H / 2;
  const totalW = totalRoundsExpected * MATCH_W + (totalRoundsExpected - 1) * CONN_W;

  const connectors: React.ReactNode[] = [];
  allRoundNumbers.forEach((round, rIdx) => {
    if (rIdx >= totalRoundsExpected - 1) return;
    const nextRound = allRoundNumbers[rIdx + 1];
    const currCount = allRoundCounts[rIdx];
    const nextCount = allRoundCounts[rIdx + 1];
    if (currCount === nextCount) return;

    const roundSlots = unifiedByRound[round];
    const x1 = rIdx * (MATCH_W + CONN_W) + MATCH_W;
    const xMid = x1 + CONN_W / 2;
    const x2 = x1 + CONN_W;

    for (let i = 0; i < roundSlots.length; i += 2) {
      const cy1 = posMap.get(`${round}-${i}`)!;
      const cyNext = posMap.get(`${nextRound}-${Math.floor(i / 2)}`)!;

      connectors.push(
        <line key={`ha-${round}-${i}`} x1={x1} y1={cy1} x2={xMid} y2={cy1} stroke={STROKE} strokeWidth={2} strokeLinecap="round" />
      );

      if (i + 1 < roundSlots.length) {
        const cy2 = posMap.get(`${round}-${i + 1}`)!;
        const cyMid = (cy1 + cy2) / 2;
        connectors.push(
          <line key={`ha-${round}-${i + 1}`} x1={x1} y1={cy2} x2={xMid} y2={cy2} stroke={STROKE} strokeWidth={2} strokeLinecap="round" />,
          <line key={`v-${round}-${i}`} x1={xMid} y1={cy1} x2={xMid} y2={cy2} stroke={STROKE} strokeWidth={2} strokeLinecap="round" />,
          <line key={`hb-${round}-${i}`} x1={xMid} y1={cyMid} x2={x2} y2={cyNext} stroke={STROKE} strokeWidth={2} strokeLinecap="round" />
        );
      } else {
        connectors.push(
          <line key={`hb-${round}-${i}`} x1={xMid} y1={cy1} x2={x2} y2={cyNext} stroke={STROKE} strokeWidth={2} strokeLinecap="round" />
        );
      }
    }
  });

  const lastRealRound = generatedRounds[generatedRounds.length - 1];
  const finalMatches = matchesByRound[lastRealRound];
  let champion: Pair | null = null;
  let championLabel: string | undefined;
  if (
    lastRealRound === totalRoundsExpected &&
    finalMatches?.length === 1 &&
    finalMatches[0].winnerId != null
  ) {
    const fm = finalMatches[0];
    if (teamMode) {
      const winTeam: TournamentTeam | null | undefined = fm.team1?.id === fm.winnerId ? fm.team1 : fm.team2;
      championLabel = winTeam?.equipo?.name;
    } else {
      champion = fm.pair1?.id === fm.winnerId ? (fm.pair1 ?? null) : (fm.pair2 ?? null);
    }
  }

  const bracketContent = (
    <>
      <Box sx={{ display: "flex", mb: 4, minWidth: totalW }}>
        {allRoundNumbers.map((round, rIdx) => (
          <Box key={round} sx={{ width: MATCH_W, flexShrink: 0, textAlign: "center", mr: rIdx < allRoundNumbers.length - 1 ? `${CONN_W}px` : 0 }}>
            <Paper elevation={0} sx={{ py: 1, px: 2, borderRadius: 2, bgcolor: "grey.50", display: "inline-block" }}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1.5, fontSize: "0.65rem" }}>
                {getRoundLabel(round, totalRoundsExpected, allRoundCounts)}
              </Typography>
            </Paper>
          </Box>
        ))}
      </Box>
      <Box sx={{ position: "relative", width: totalW, height: totalH, minWidth: totalW }}>
        <svg style={{ position: "absolute", top: 0, left: 0, width: totalW, height: totalH, pointerEvents: "none", overflow: "visible" }}>
          {connectors}
        </svg>
        {allRoundNumbers.map((round, rIdx) =>
          unifiedByRound[round].map((slot, mIdx) => {
            const cy = posMap.get(`${round}-${mIdx}`)!;
            const isR1 = round === allRoundNumbers[0];
            const isR2Cross = hasCrossPhase && round === allRoundNumbers[1];
            return (
              <Box key={isVirtual(slot) ? `v-${round}-${mIdx}` : slot.id} sx={{ position: "absolute", top: cy - MATCH_H / 2, left: rIdx * (MATCH_W + CONN_W), width: MATCH_W, height: MATCH_H }}>
                {isVirtual(slot) ? (
                  <PlaceholderCard readOnly={readOnly} onClick={readOnly ? undefined : () => onVirtualMatchClick?.(slot.round, slot.matchNumber)} />
                ) : isPlaceholder(slot, teamMode) ? (
                  <PlaceholderCard
                    scheduledAt={slot.scheduledAt ?? undefined}
                    courtName={slot.court?.name}
                    crossLabels={isR2Cross ? getCrossLabels(mIdx) : undefined}
                    readOnly={readOnly}
                    onClick={readOnly ? undefined : () => onEditMatch?.(slot)}
                  />
                ) : (
                  <BracketMatchCard
                    match={slot}
                    groupLabel={hasCrossPhase && isR1 ? getGroupLabel(mIdx) : undefined}
                    readOnly={readOnly}
                    onEdit={readOnly ? undefined : () => onEditMatch?.(slot)}
                    teamMode={teamMode}
                  />
                )}
              </Box>
            );
          })
        )}
      </Box>

      {/* ── Add match / add round buttons ──────────────────────────────── */}
      {!readOnly && onAddMatchToRound && (
        <Box sx={{ display: "flex", mt: 2.5, minWidth: totalW, alignItems: "center" }}>
          {allRoundNumbers.map((round, rIdx) => {
            const label = getRoundLabel(round, totalRoundsExpected, allRoundCounts);
            const isElim = ELIMINATION_LABELS.has(label);
            return (
              <Box
                key={round}
                sx={{ width: MATCH_W, flexShrink: 0, display: "flex", justifyContent: "center", mr: rIdx < allRoundNumbers.length - 1 ? `${CONN_W}px` : 0 }}
              >
                {!isElim && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                    onClick={() => onAddMatchToRound(round)}
                    sx={{
                      textTransform: "none", fontSize: "0.72rem", fontWeight: 600,
                      borderRadius: 2, color: "text.secondary", borderColor: "divider",
                      py: 0.4, px: 1.5,
                      "&:hover": { borderColor: "primary.main", color: "primary.main", bgcolor: "primary.50" },
                    }}
                  >
                    Partido
                  </Button>
                )}
              </Box>
            );
          })}
          {/* Nueva ronda: solo si el último round NO es eliminatorio */}
          {(() => {
            const lastRound = allRoundNumbers[allRoundNumbers.length - 1];
            const lastLabel = getRoundLabel(lastRound, totalRoundsExpected, allRoundCounts);
            if (ELIMINATION_LABELS.has(lastLabel) || !onAddNewRound) return null;
            return (
              <Box sx={{ ml: `${CONN_W}px`, flexShrink: 0 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                  onClick={() => onAddNewRound(lastRound + 1)}
                  sx={{
                    textTransform: "none", fontSize: "0.72rem", fontWeight: 600,
                    borderRadius: 2, color: "text.secondary", borderColor: "divider",
                    py: 0.4, px: 1.5,
                    "&:hover": { borderColor: "primary.main", color: "primary.main", bgcolor: "primary.50" },
                  }}
                >
                  Nueva ronda
                </Button>
              </Box>
            );
          })()}
        </Box>
      )}
    </>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4, alignItems: "flex-start" }}>
      <Box sx={{ flex: 1, minWidth: 0, width: { xs: "100%", md: "auto" } }}>
        {generatedRounds.length > 0 && (
          <Box sx={{ overflowX: "auto", overflowY: "visible", pb: 2 }}>
            {bracketContent}
          </Box>
        )}
        {rrR1Matches.length > 0 && (
          <RRGroupPanel
            r1Matches={rrR1Matches}
            r2Crosses={rrR2Matches}
            onEditMatch={onEditMatch}
            readOnly={readOnly}
          />
        )}
      </Box>
      {(champion || championLabel) && (
        <Box sx={{ flexShrink: 0, width: { xs: "100%", md: 240 }, pt: { md: 8 } }}>
          <ChampionBanner champion={champion ?? undefined} championLabel={championLabel} sex={sex} />
        </Box>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function parseDiff(result: string | null | undefined, pairId: number, pair1Id?: number | null): number {
  if (!result) return 0;
  // Supports "6-3" or "6-3, 7-5" etc. — sum set differences
  let diff = 0;
  for (const part of result.split(",")) {
    const [a, b] = part.trim().split("-").map(Number);
    if (isNaN(a) || isNaN(b)) continue;
    diff += pairId === pair1Id ? a - b : b - a;
  }
  return diff;
}

function RRGroupPanel({
  r1Matches,
  r2Crosses,
  onEditMatch,
  readOnly,
}: {
  r1Matches: TournamentMatch[];
  r2Crosses: TournamentMatch[];
  onEditMatch?: (m: TournamentMatch) => void;
  readOnly?: boolean;
}) {
  const groupTag = r1Matches[0]?.groupTag ?? "";
  const groupLetter = groupTag.replace("RR-", "");

  // Collect all 3 pairs: A & B from R1 match, C from R2 crosses (pair2 pre-filled)
  const r1Match = r1Matches[0];
  const pairA = r1Match?.pair1 ?? null;
  const pairB = r1Match?.pair2 ?? null;
  const pairC = r2Crosses[0]?.pair2 ?? null; // C is pre-filled as pair2 in both crosses

  // Compute wins and score diff across ALL matches (R1 + R2 crosses)
  const allMatches = [...r1Matches, ...r2Crosses];
  const wins = new Map<number, number>();
  const diff = new Map<number, number>();

  allMatches.forEach(m => {
    if (m.winnerId != null) wins.set(m.winnerId, (wins.get(m.winnerId) ?? 0) + 1);
    const p1id = m.pair1?.id ?? null;
    if (m.pair1?.id != null) diff.set(m.pair1.id, (diff.get(m.pair1.id) ?? 0) + parseDiff(m.result, m.pair1.id, p1id));
    if (m.pair2?.id != null) diff.set(m.pair2.id, (diff.get(m.pair2.id) ?? 0) + parseDiff(m.result, m.pair2.id, p1id));
  });

  const allPairs = [pairA, pairB, pairC].filter(Boolean) as Pair[];
  const allPlayed = allMatches.length > 0 && allMatches.every(m => m.status === "COMPLETED" || m.status === "FORFEIT");
  const anyPlayed = allMatches.some(m => m.status === "COMPLETED" || m.status === "FORFEIT");

  const standings = [...allPairs].sort((a, b) => {
    const wDiff = (wins.get(b.id) ?? 0) - (wins.get(a.id) ?? 0);
    if (wDiff !== 0) return wDiff;
    return (diff.get(b.id) ?? 0) - (diff.get(a.id) ?? 0);
  });

  const crossLabels: [string, string][] = [
    [`G-${groupLetter}1`, `vs Grupo ${groupLetter}`],
    [`P-${groupLetter}1`, `vs Grupo ${groupLetter}`],
  ];

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Paper elevation={0} sx={{ py: 0.75, px: 2, borderRadius: 2, bgcolor: "primary.50", display: "inline-block" }}>
          <Typography variant="caption" fontWeight={800} color="primary.main" sx={{ textTransform: "uppercase", letterSpacing: 1.5, fontSize: "0.65rem" }}>
            GRUPO {groupLetter} · 3 Parejas
          </Typography>
        </Paper>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
          Top 2 por diferencia de puntos → 2da Ronda
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Phase 1: R1 match */}
        <Box>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 0.75 }}>
            1ra Ronda
          </Typography>
          <Box sx={{ width: MATCH_W, height: MATCH_H }}>
            {r1Match ? (
              isPlaceholder(r1Match) ? (
                <PlaceholderCard readOnly={readOnly} onClick={readOnly ? undefined : () => onEditMatch?.(r1Match)} />
              ) : (
                <BracketMatchCard match={r1Match} readOnly={readOnly} onEdit={readOnly ? undefined : () => onEditMatch?.(r1Match)} />
              )
            ) : null}
          </Box>
          {pairC && (
            <Box sx={{ mt: 1, width: MATCH_W, py: 0.5, px: 1.5, bgcolor: "grey.50", borderRadius: 1.5, border: "1px dashed #e2e8f0", display: "flex", alignItems: "center", gap: 1 }}>
              <Typography sx={{ fontSize: "0.68rem", color: "text.disabled" }}>
                Descansa: {pairC.player1.name.split(" ")[0]}{pairC.player2 ? ` / ${pairC.player2.name.split(" ")[0]}` : ""}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Phase 2: R2 crosses */}
        {r2Crosses.length > 0 && (
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 0.75 }}>
              Cruces (2da Ronda)
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {r2Crosses.map((m, idx) => (
                <Box key={m.id} sx={{ width: MATCH_W, height: MATCH_H }}>
                  {isPlaceholder(m) ? (
                    <PlaceholderCard
                      crossLabels={{ pair1Label: crossLabels[idx]?.[0] ?? "A definir", pair2Label: pairC ? (pairC.player1.name.split(" ")[0] + (pairC.player2 ? ` / ${pairC.player2.name.split(" ")[0]}` : "")) : "A definir" }}
                      readOnly={readOnly}
                      onClick={readOnly ? undefined : () => onEditMatch?.(m)}
                    />
                  ) : (
                    <BracketMatchCard match={m} readOnly={readOnly} onEdit={readOnly ? undefined : () => onEditMatch?.(m)} />
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Standings (visible once any match played) */}
        {anyPlayed && (
          <Box sx={{ minWidth: 160 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 1, display: "block", mb: 0.75 }}>
              Posiciones
            </Typography>
            {standings.map((pair, idx) => {
              const p1 = pair.player1.name.split(" ")[0];
              const p2 = pair.player2?.name.split(" ")[0];
              const name = p2 ? `${p1} / ${p2}` : p1;
              const w = wins.get(pair.id) ?? 0;
              const d = diff.get(pair.id) ?? 0;
              const isTop2 = allPlayed && idx < 2;
              return (
                <Box key={pair.id} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5, px: 1, mb: 0.5, borderRadius: 1.5, bgcolor: isTop2 ? "success.50" : "grey.50", border: "1px solid", borderColor: isTop2 ? "success.200" : "divider" }}>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: isTop2 ? "success.700" : "text.disabled", minWidth: 16 }}>
                    {idx + 1}°
                  </Typography>
                  <Typography noWrap sx={{ fontSize: "0.72rem", fontWeight: isTop2 ? 600 : 400, flex: 1, minWidth: 0 }}>
                    {name}
                  </Typography>
                  <Typography sx={{ fontSize: "0.68rem", color: isTop2 ? "success.700" : "text.secondary", fontWeight: 600 }}>
                    {w}V {d >= 0 ? `+${d}` : d}
                  </Typography>
                </Box>
              );
            })}
            {allPlayed && (
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.6rem", mt: 0.5, display: "block" }}>
                Top 2 avanzan manualmente a la siguiente ronda
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function PlaceholderCard({
  scheduledAt,
  courtName,
  crossLabels,
  readOnly,
  onClick,
}: {
  scheduledAt?: string;
  courtName?: string;
  crossLabels?: { pair1Label: string; pair2Label: string } | null;
  readOnly?: boolean;
  onClick?: () => void;
}) {
  const hasSchedule = !!scheduledAt;
  const label1 = crossLabels?.pair1Label ?? "A definir";
  const label2 = crossLabels?.pair2Label ?? "A definir";
  const hasLabels = !!crossLabels;
  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        width: "100%", height: "100%",
        border: "1.5px dashed",
        borderColor: hasSchedule ? "primary.light" : "#e2e8f0",
        borderRadius: 3, overflow: "hidden",
        display: "flex",
        cursor: readOnly ? "default" : "pointer",
        bgcolor: "#fff",
        opacity: hasSchedule ? 0.9 : 0.6,
        transition: "all 0.2s ease",
        ...(!readOnly && { "&:hover": { opacity: 1, borderColor: "primary.main", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" } }),
      }}
    >
      <Box sx={{ width: 4, flexShrink: 0, bgcolor: hasSchedule ? "primary.light" : "#f1f5f9" }} />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 2 }}>
          <Typography variant="caption" sx={{ fontSize: "0.75rem", color: hasLabels ? "text.secondary" : "text.disabled", fontWeight: 600 }}>
            {label1}
          </Typography>
        </Box>
        <Box sx={{ height: "1px", bgcolor: "#f1f5f9" }} />
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 2 }}>
          <Typography variant="caption" sx={{ fontSize: "0.75rem", color: hasLabels ? "text.secondary" : "text.disabled", fontWeight: 600 }}>
            {label2}
          </Typography>
        </Box>
        {hasSchedule && (
          <Box sx={{ py: 0.5, px: 1.5, bgcolor: "primary.50", display: "flex", alignItems: "center", gap: 0.75 }}>
            <AccessTimeIcon sx={{ fontSize: 12, color: "primary.main" }} />
            <Typography variant="caption" color="primary.main" sx={{ fontSize: "0.65rem", fontWeight: 700 }}>
              {new Date(scheduledAt!).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              {courtName ? ` · ${courtName}` : ""}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const LIVE_STATUS_COLORS: Record<string, { stripe: string; border: string; bg: string; text: string; label: string }> = {
  IN_PLAY: { stripe: "#10b981", border: "#a7f3d0", bg: "#f0fdf4", text: "#065f46", label: "En juego" },
  DELAYED:  { stripe: "#f59e0b", border: "#fde68a", bg: "#fffbeb", text: "#92400e", label: "Atrasado" },
  EARLY:    { stripe: "#3b82f6", border: "#bfdbfe", bg: "#eff6ff", text: "#1e40af", label: "Adelantado" },
};

function BracketMatchCard({ match, groupLabel, readOnly, onEdit, teamMode }: { match: TournamentMatch; groupLabel?: string; readOnly?: boolean; onEdit?: () => void; teamMode?: boolean }) {
  const isBye = match.status === "BYE";
  const isCompleted = match.status === "COMPLETED";
  const isForfeit = match.status === "FORFEIT";
  const pair1Won = match.winnerId != null && (teamMode ? match.team1?.id === match.winnerId : match.pair1?.id === match.winnerId);
  const pair2Won = match.winnerId != null && (teamMode ? match.team2?.id === match.winnerId : match.pair2?.id === match.winnerId);
  const live = match.liveStatus ? LIVE_STATUS_COLORS[match.liveStatus] : null;
  const sideColor = live ? live.stripe : isBye ? "#3b82f6" : isCompleted ? "#10b981" : isForfeit ? "#94a3b8" : "#cbd5e1";

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%", height: "100%",
        border: "1px solid",
        borderColor: live ? live.border : isCompleted ? "#d1fae5" : isForfeit ? "#e2e8f0" : "#e2e8f0",
        bgcolor: live ? live.bg : isForfeit ? "#f8fafc" : "#fff",
        borderRadius: 3, overflow: "hidden",
        display: "flex",
        cursor: readOnly ? "default" : "pointer",
        transition: "all 0.2s ease",
        ...(!readOnly && { "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 16px rgba(0,0,0,0.1)", borderColor: "#cbd5e1" } }),
      }}
      onClick={readOnly ? undefined : onEdit}
    >
      <Box sx={{ width: 6, flexShrink: 0, bgcolor: sideColor }} />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {teamMode ? (
          <TeamRow team={match.team1} isWinner={pair1Won} isLoser={pair2Won} isBye={!match.team1} />
        ) : (
          <PairRow pair={match.pair1} isWinner={pair1Won} isLoser={pair2Won} isBye={!match.pair1} />
        )}
        <Box sx={{ height: "1px", bgcolor: "#f1f5f9" }} />
        {teamMode ? (
          <TeamRow team={match.team2} isWinner={pair2Won} isLoser={pair1Won} isBye={!match.team2} />
        ) : (
          <PairRow pair={match.pair2} isWinner={pair2Won} isLoser={pair1Won} isBye={!match.pair2} />
        )}
        
        <Box sx={{ mt: "auto", px: 1.5, py: 0.5, bgcolor: live ? "transparent" : "grey.50", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {groupLabel && (
            <Typography variant="caption" fontWeight={800} sx={{ fontSize: "0.6rem", color: "primary.main", letterSpacing: 0.5 }}>
              GRUPO {groupLabel}
            </Typography>
          )}
          {match.photoUrl && (
            <Tooltip title="Ver foto del partido">
              <Box
                component="a"
                href={match.photoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                sx={{ display: "flex", alignItems: "center", color: "primary.main", flexShrink: 0 }}
              >
                <PhotoCameraIcon sx={{ fontSize: 12 }} />
              </Box>
            </Tooltip>
          )}
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center", gap: 1 }}>
            {match.result ? (
              <Typography variant="caption" fontWeight={800} sx={{ fontSize: "0.7rem", color: "text.primary" }}>
                {match.result}
              </Typography>
            ) : live ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: live.stripe, animation: "pulse 2s infinite" }} />
                <Typography variant="caption" fontWeight={800} sx={{ fontSize: "0.65rem", color: live.text, textTransform: "uppercase" }}>
                  {live.label}
                </Typography>
              </Box>
            ) : (match.scheduledAt || match.court?.name) ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.disabled" }}>
                {match.scheduledAt && <AccessTimeIcon sx={{ fontSize: 10 }} />}
                <Typography variant="caption" sx={{ fontSize: "0.65rem", fontWeight: 600 }}>
                  {match.scheduledAt ? new Date(match.scheduledAt).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                  {match.court?.name ? (match.scheduledAt ? ` · ${match.court.name}` : match.court.name) : ""}
                </Typography>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </Paper>
  );
}

function PlayerMiniAvatar({ name, avatarUrl, dim }: { name: string; avatarUrl?: string; dim: boolean }) {
  return (
    <Avatar
      src={avatarUrl}
      sx={{
        width: 18, height: 18,
        fontSize: "0.45rem",
        fontWeight: 700,
        bgcolor: dim ? "#cbd5e1" : stringToColor(name),
        opacity: dim ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      {!avatarUrl && getInitials(name)}
    </Avatar>
  );
}

function TeamRow({ team, isWinner, isLoser, isBye }: { team: TournamentTeam | null | undefined; isWinner: boolean; isLoser: boolean; isBye: boolean }) {
  const dim = isBye || isLoser;
  if (!team) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 2 }}>
        <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.disabled", fontWeight: 500 }}>
          A definir
        </Typography>
      </Box>
    );
  }
  const textColor = dim ? "text.disabled" : "text.primary";
  const fw = isWinner ? 700 : 500;
  return (
    <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 1.5, gap: 0.5, overflow: "hidden", bgcolor: isWinner ? "rgba(16, 185, 129, 0.05)" : "transparent" }}>
      <Avatar
        src={team.equipo.avatarUrl}
        sx={{
          width: 18, height: 18, fontSize: "0.45rem", fontWeight: 700,
          bgcolor: dim ? "#cbd5e1" : stringToColor(team.equipo.name),
          opacity: dim ? 0.5 : 1, flexShrink: 0,
        }}
      >
        {!team.equipo.avatarUrl && getInitials(team.equipo.name)}
      </Avatar>
      <Typography noWrap sx={{ fontSize: "0.78rem", fontWeight: fw, color: textColor, flex: 1, minWidth: 0 }}>
        {team.equipo.name}
      </Typography>
      {isWinner && <EmojiEventsIcon sx={{ fontSize: 13, color: "#f5ad27", flexShrink: 0 }} />}
    </Box>
  );
}

function PairRow({ pair, isWinner, isLoser, isBye }: { pair: Pair | null | undefined; isWinner: boolean; isLoser: boolean; isBye: boolean }) {
  const dim = isBye || isLoser;
  if (!pair) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 2 }}>
        <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.disabled", fontWeight: 500 }}>
          A definir
        </Typography>
      </Box>
    );
  }
  const p1 = pair.player1.name.split(" ")[0];
  const textColor = dim ? "text.disabled" : "text.primary";
  const fw = isWinner ? 700 : 500;
  return (
    <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 1.5, gap: 0.5, overflow: "hidden", bgcolor: isWinner ? "rgba(16, 185, 129, 0.05)" : "transparent" }}>
      <PlayerMiniAvatar name={pair.player1.name} avatarUrl={pair.player1.avatarUrl} dim={dim} />
      <Typography noWrap sx={{ fontSize: "0.78rem", fontWeight: fw, color: textColor, flexShrink: 1, minWidth: 0 }}>
        {p1}
      </Typography>
      {pair.player2 && (
        <>
          <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", flexShrink: 0 }}>/</Typography>
          <PlayerMiniAvatar name={pair.player2.name} avatarUrl={pair.player2.avatarUrl} dim={dim} />
          <Typography noWrap sx={{ fontSize: "0.78rem", fontWeight: fw, color: textColor, flex: 1, minWidth: 0 }}>
            {pair.player2.name.split(" ")[0]}
          </Typography>
        </>
      )}
      {isWinner && <EmojiEventsIcon sx={{ fontSize: 13, color: "#f5ad27", flexShrink: 0 }} />}
    </Box>
  );
}
