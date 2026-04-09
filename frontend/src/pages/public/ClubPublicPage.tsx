import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import type { TournamentMatch, Pair, TournamentDetail } from "../../types/Tournament";
import { fetchPublicProfile, fetchPublicTournaments, fetchPublicTournamentDetail } from "../../api/publicService";

// ─── constants ──────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  PRIMERA: "1ra", SEGUNDA: "2da", TERCERA: "3ra", CUARTA: "4ta",
  QUINTA: "5ta", SEXTA: "6ta", SEPTIMA: "7ma", SIN_CATEGORIA: "Sin categoría",
};

const FORMAT_LABEL: Record<string, string> = {
  ROUND_ROBIN: "Round Robin",
  BRACKET: "Llaves",
};

const STATUS_LABEL: Record<string, { label: string; color: "success" | "info" | "default" }> = {
  ACTIVE:  { label: "En curso",     color: "success" },
  DRAFT:   { label: "Por comenzar", color: "info" },
};

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// ─── helpers ─────────────────────────────────────────────────────────────────

function pairLabel(pair: Pair | null | undefined): string {
  if (!pair) return "BYE";
  return `${pair.player1.name.split(" ")[0]} / ${pair.player2.name.split(" ")[0]}`;
}

function getRoundLabel(roundNumber: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNumber;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinales";
  if (fromEnd === 2) return "Cuartos de final";
  if (fromEnd === 3) return "Octavos de final";
  return `Ronda ${roundNumber}`;
}

// ─── read-only bracket ────────────────────────────────────────────────────────

const MATCH_H = 84;
const MATCH_W = 210;
const CONN_W = 48;
const GAP_1 = 16;
const STROKE = "#d0d0d0";

function ReadOnlyBracket({ matches }: { matches: TournamentMatch[] }) {
  const bracketMatches = matches.filter(m => !m.isRepechage);

  const matchesByRound: Record<number, TournamentMatch[]> = {};
  bracketMatches.forEach(m => {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
    matchesByRound[m.round].push(m);
  });

  const generatedRounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  if (!generatedRounds.length) return null;

  const round1Count = matchesByRound[generatedRounds[0]].length;
  const allRoundCounts: number[] = [round1Count];
  let remaining = round1Count;
  while (remaining > 1) { remaining = Math.ceil(remaining / 2); allRoundCounts.push(remaining); }
  const totalRounds = allRoundCounts.length;
  const allRoundNums = Array.from({ length: totalRounds }, (_, i) => i + 1);

  const unifiedByRound: Record<number, (TournamentMatch | { virtual: true; round: number; matchNumber: number })[]> = {};
  allRoundNums.forEach((rn, ri) => {
    unifiedByRound[rn] = matchesByRound[rn] ?? Array.from({ length: allRoundCounts[ri] }, (_, i) => ({ virtual: true as const, round: rn, matchNumber: i + 1 }));
  });

  const posMap = new Map<string, number>();
  const span0 = MATCH_H + GAP_1;
  unifiedByRound[1].forEach((_, i) => posMap.set(`1-${i}`, MATCH_H / 2 + i * span0));
  for (let ri = 1; ri < allRoundNums.length; ri++) {
    const prev = allRoundNums[ri - 1];
    const curr = allRoundNums[ri];
    unifiedByRound[curr].forEach((_, i) => {
      const cy1 = posMap.get(`${prev}-${2 * i}`) ?? 0;
      const cy2 = posMap.get(`${prev}-${2 * i + 1}`);
      posMap.set(`${curr}-${i}`, cy2 != null ? (cy1 + cy2) / 2 : cy1);
    });
  }

  const allCenters = Array.from(posMap.values());
  const totalH = Math.max(...allCenters) + MATCH_H / 2;
  const totalW = totalRounds * MATCH_W + (totalRounds - 1) * CONN_W;

  const connectors: React.ReactNode[] = [];
  allRoundNums.forEach((round, ri) => {
    if (ri >= totalRounds - 1) return;
    const nextRound = allRoundNums[ri + 1];
    const slots = unifiedByRound[round];
    const x1 = ri * (MATCH_W + CONN_W) + MATCH_W;
    const xMid = x1 + CONN_W / 2;
    const x2 = x1 + CONN_W;
    for (let i = 0; i < slots.length; i += 2) {
      const cy1 = posMap.get(`${round}-${i}`)!;
      const cyNext = posMap.get(`${nextRound}-${Math.floor(i / 2)}`)!;
      connectors.push(<line key={`ha-${round}-${i}`} x1={x1} y1={cy1} x2={xMid} y2={cy1} stroke={STROKE} strokeWidth={1.5} strokeLinecap="round" />);
      if (i + 1 < slots.length) {
        const cy2 = posMap.get(`${round}-${i + 1}`)!;
        connectors.push(
          <line key={`ha2-${round}-${i}`} x1={x1} y1={cy2} x2={xMid} y2={cy2} stroke={STROKE} strokeWidth={1.5} strokeLinecap="round" />,
          <line key={`v-${round}-${i}`} x1={xMid} y1={cy1} x2={xMid} y2={cy2} stroke={STROKE} strokeWidth={1.5} strokeLinecap="round" />,
          <line key={`hb-${round}-${i}`} x1={xMid} y1={(cy1 + cy2) / 2} x2={x2} y2={cyNext} stroke={STROKE} strokeWidth={1.5} strokeLinecap="round" />,
        );
      } else {
        connectors.push(<line key={`hb-${round}-${i}`} x1={xMid} y1={cy1} x2={x2} y2={cyNext} stroke={STROKE} strokeWidth={1.5} strokeLinecap="round" />);
      }
    }
  });

  // Champion detection
  const lastRound = generatedRounds[generatedRounds.length - 1];
  const finalMatches = matchesByRound[lastRound];
  let champion: Pair | null = null;
  if (lastRound === totalRounds && finalMatches?.length === 1 && finalMatches[0].winnerId != null) {
    const fm = finalMatches[0];
    champion = fm.pair1?.id === fm.winnerId ? (fm.pair1 ?? null) : (fm.pair2 ?? null);
  }

  return (
    <Box sx={{ overflowX: "auto", pb: 2, WebkitOverflowScrolling: "touch" }}>
      {/* Round headers */}
      <Box sx={{ display: "flex", mb: 2, minWidth: totalW }}>
        {allRoundNums.map((round, ri) => (
          <Box key={round} sx={{ width: MATCH_W, flexShrink: 0, textAlign: "center", mr: ri < allRoundNums.length - 1 ? `${CONN_W}px` : 0 }}>
            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1.2, fontSize: "0.68rem" }}>
              {getRoundLabel(round, totalRounds)}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Canvas */}
      <Box sx={{ position: "relative", width: totalW, height: totalH, minWidth: totalW }}>
        <svg style={{ position: "absolute", top: 0, left: 0, width: totalW, height: totalH, pointerEvents: "none", overflow: "visible" }}>
          {connectors}
        </svg>
        {allRoundNums.map((round, ri) =>
          unifiedByRound[round].map((slot, mi) => {
            const cy = posMap.get(`${round}-${mi}`)!;
            const isVirt = "virtual" in slot;
            return (
              <Box key={isVirt ? `v-${round}-${mi}` : (slot as TournamentMatch).id} sx={{ position: "absolute", top: cy - MATCH_H / 2, left: ri * (MATCH_W + CONN_W), width: MATCH_W, height: MATCH_H }}>
                {isVirt ? (
                  <EmptyCard />
                ) : (
                  <PublicMatchCard match={slot as TournamentMatch} />
                )}
              </Box>
            );
          })
        )}
      </Box>

      {champion && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 2, px: 3, py: 1.5, bgcolor: "#fffbeb", border: "2px solid #f59e0b", borderRadius: 3 }}>
            <EmojiEventsIcon sx={{ color: "#f59e0b", fontSize: 36 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 1.2, display: "block" }}>Campeón</Typography>
              <Typography variant="subtitle1" fontWeight={800} lineHeight={1.3}>{champion.player1.name} / {champion.player2.name}</Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function EmptyCard() {
  return (
    <Paper elevation={0} sx={{ width: "100%", height: "100%", border: "1.5px dashed", borderColor: "divider", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.45 }}>
      <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.7rem" }}>A definir</Typography>
    </Paper>
  );
}

const LIVE_STATUS_COLORS: Record<string, { stripe: string; border: string; bg: string; text: string; label: string }> = {
  IN_PLAY: { stripe: "#4caf50", border: "#a5d6a7", bg: "#f1f8f1", text: "#2e7d32", label: "En juego" },
  DELAYED:  { stripe: "#ff9800", border: "#ffcc80", bg: "#fff8f0", text: "#e65100", label: "Atrasado" },
  EARLY:    { stripe: "#29b6f6", border: "#90caf9", bg: "#f0f8ff", text: "#1565c0", label: "Adelantado" },
};

function PublicMatchCard({ match }: { match: TournamentMatch }) {
  const isBye = match.status === "BYE";
  const isCompleted = match.status === "COMPLETED";
  const pair1Won = match.winnerId != null && match.pair1?.id === match.winnerId;
  const pair2Won = match.winnerId != null && match.pair2?.id === match.winnerId;
  const live = match.liveStatus ? LIVE_STATUS_COLORS[match.liveStatus] : null;
  const sideColor = live ? live.stripe : isBye ? "#90caf9" : isCompleted ? "#66bb6a" : "#e0e0e0";
  const isPlaceholder = !match.pair1 && !match.pair2;

  return (
    <Paper elevation={0} sx={{ width: "100%", height: "100%", border: "1.5px solid", borderColor: live ? live.border : isCompleted ? "#c8e6c9" : "divider", bgcolor: live ? live.bg : "background.paper", borderRadius: 2, overflow: "hidden", display: "flex" }}>
      <Box sx={{ width: 4, flexShrink: 0, bgcolor: sideColor }} />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <PublicPairRow label={isPlaceholder ? "A definir" : pairLabel(match.pair1)} isWinner={pair1Won} isLoser={pair2Won} isPlaceholder={isPlaceholder} />
        <Box sx={{ height: "1px", bgcolor: live ? live.border : "divider", flexShrink: 0 }} />
        <PublicPairRow label={isPlaceholder ? "A definir" : pairLabel(match.pair2)} isWinner={pair2Won} isLoser={pair1Won} isPlaceholder={isPlaceholder} />
        <Box sx={{ height: "1px", bgcolor: live ? live.border : "divider", flexShrink: 0 }} />
        <Box sx={{ flexShrink: 0, height: 16, display: "flex", alignItems: "center", justifyContent: "center", px: 1, bgcolor: live ? live.bg : "grey.50" }}>
          {match.result ? (
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: "0.62rem" }}>{match.result}</Typography>
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

function PublicPairRow({ label, isWinner, isLoser, isPlaceholder }: { label: string; isWinner: boolean; isLoser: boolean; isPlaceholder: boolean }) {
  return (
    <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 1, gap: 0.5, bgcolor: isWinner ? "rgba(76,175,80,0.10)" : "transparent", minWidth: 0 }}>
      {isWinner ? (
        <EmojiEventsIcon sx={{ fontSize: 11, color: "#f59e0b", flexShrink: 0 }} />
      ) : (
        <Box sx={{ width: 11, flexShrink: 0 }} />
      )}
      <Typography variant="caption" noWrap sx={{ flex: 1, fontSize: "0.7rem", fontWeight: isWinner ? 700 : 400, color: isPlaceholder ? "text.disabled" : isLoser ? "text.disabled" : "text.primary", minWidth: 0 }}>
        {label}
      </Typography>
    </Box>
  );
}

// ─── round-robin match list ───────────────────────────────────────────────────

function RoundRobinList({ matches }: { matches: TournamentMatch[] }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {matches.map(m => {
        const live = m.liveStatus ? LIVE_STATUS_COLORS[m.liveStatus] : null;
        return (
          <Paper key={m.id} elevation={0} sx={{ borderRadius: 2, p: 1.5, border: "1px solid", borderColor: live ? live.border : "divider", bgcolor: live ? live.bg : "background.paper" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography variant="body2" sx={{ flex: 1, minWidth: 120 }}>
                <strong>{pairLabel(m.pair1)}</strong>
                <Typography component="span" variant="caption" color="text.secondary" mx={0.75}>vs</Typography>
                <strong>{pairLabel(m.pair2)}</strong>
              </Typography>
              {m.result && (
                <Typography variant="caption" fontWeight={700} color="success.main">{m.result}</Typography>
              )}
              {live && !m.result && (
                <Typography variant="caption" fontWeight={700} sx={{ color: live.text }}>
                  {live.label}
                  {m.liveStatus === "DELAYED" && m.delayedUntil
                    ? ` · ${new Date(m.delayedUntil).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
                    : ""}
                </Typography>
              )}
              {!live && m.scheduledAt && !m.result && (
                <Typography variant="caption" color="text.secondary">
                  {new Date(m.scheduledAt).toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {m.court?.name ? ` · ${m.court.name}` : ""}
                </Typography>
              )}
              <Chip label={m.status === "COMPLETED" ? "Finalizado" : live ? live.label : "Pendiente"} size="small" color={m.status === "COMPLETED" ? "success" : "default"} sx={{ height: 20, fontSize: "0.68rem", ...(live ? { bgcolor: live.bg, color: live.text, borderColor: live.border } : {}) }} />
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}

// ─── tournament fixture panel ─────────────────────────────────────────────────

function TournamentFixture({ username, tournamentId }: { username: string; tournamentId: number }) {
  const { data, isLoading } = useQuery<TournamentDetail>({
    queryKey: ["publicTournamentDetail", username, tournamentId],
    queryFn: () => fetchPublicTournamentDetail(username, tournamentId),
  });

  if (isLoading) return <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}><CircularProgress size={24} /></Box>;
  if (!data) return null;

  const isBracket = data.format === "BRACKET";
  const hasMatches = data.matches.length > 0;

  if (!hasMatches) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {data.pairs.length === 0 ? "El torneo aún no tiene parejas inscriptas." : "El fixture aún no fue generado."}
        </Typography>
        {data.pairs.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Parejas inscriptas</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
              {data.pairs.map(p => (
                <Chip key={p.id} size="small" label={`${p.player1.name} / ${p.player2.name}`} variant="outlined" />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 1 }}>
      {isBracket ? (
        <ReadOnlyBracket matches={data.matches} />
      ) : (
        <RoundRobinList matches={data.matches} />
      )}
    </Box>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ClubPublicPage() {
  const { username } = useParams<{ username: string }>();
  const [expandedId, setExpandedId] = useState<number | false>(false);

  const { data: profile, isLoading: profileLoading, isError: profileError } = useQuery({
    queryKey: ["publicProfile", username],
    queryFn: () => fetchPublicProfile(username!),
    enabled: !!username,
    retry: false,
  });

  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ["publicTournaments", username],
    queryFn: () => fetchPublicTournaments(username!),
    enabled: !!username,
  });

  if (profileLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (profileError || !profile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight={700} mb={1}>Club no encontrado</Typography>
          <Typography color="text.secondary">No existe un club con ese nombre de usuario.</Typography>
        </Box>
      </Box>
    );
  }

  const mapUrl = profile.latitude && profile.longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${profile.longitude - 0.006}%2C${profile.latitude - 0.004}%2C${profile.longitude + 0.006}%2C${profile.latitude + 0.004}&layer=mapnik&marker=${profile.latitude}%2C${profile.longitude}`
    : null;

  const handleAccordion = (id: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedId(isExpanded ? id : false);
  };

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="md">

        {/* ── Club header ────────────────────────────────────── */}
        <Paper elevation={0} sx={{ borderRadius: 3, p: { xs: 3, md: 4 }, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
            {profile.logoBase64 && (
              <Box
                component="img"
                src={profile.logoBase64}
                alt="logo"
                sx={{ width: 80, height: 80, borderRadius: 2, objectFit: "contain", flexShrink: 0, border: "1px solid", borderColor: "divider" }}
              />
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h4" fontWeight={800} lineHeight={1.2} mb={0.5}>
                {profile.clubName || "Club de Pádel"}
              </Typography>
              {profile.address && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <LocationOnIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  <Typography variant="body2" color="text.secondary">{profile.address}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        {/* ── Map ────────────────────────────────────────────── */}
        {mapUrl && (
          <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", mb: 3, height: 260 }}>
            <Box
              component="iframe"
              src={mapUrl}
              title="Ubicación del club"
              sx={{ width: "100%", height: "100%", border: 0, display: "block" }}
              loading="lazy"
            />
          </Paper>
        )}

        {/* ── Business hours ─────────────────────────────────── */}
        {profile.businessHours && profile.businessHours.length > 0 && (
          <Paper elevation={0} sx={{ borderRadius: 3, p: { xs: 2, md: 3 }, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <AccessTimeIcon sx={{ fontSize: 20, color: "text.secondary" }} />
              <Typography variant="h6" fontWeight={700}>Horarios</Typography>
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(7, 1fr)" }, gap: 1 }}>
              {DAYS.map(day => {
                const schedule = profile.businessHours.find(h => h.day === day);
                const isOpen = schedule?.isOpen;
                return (
                  <Box key={day} sx={{ textAlign: "center", p: 1.5, borderRadius: 2, bgcolor: isOpen ? "primary.50" : "grey.100", border: "1px solid", borderColor: isOpen ? "primary.100" : "grey.200" }}>
                    <Typography variant="caption" fontWeight={700} color={isOpen ? "primary.main" : "text.disabled"} sx={{ display: "block", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: 0.8 }}>
                      {day.slice(0, 3)}
                    </Typography>
                    {isOpen ? (
                      <>
                        <Typography variant="caption" sx={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "text.primary", mt: 0.5 }}>
                          {schedule!.openTime}
                        </Typography>
                        <Typography variant="caption" sx={{ display: "block", fontSize: "0.7rem", color: "text.secondary" }}>
                          {schedule!.closeTime}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5, fontSize: "0.7rem" }}>
                        Cerrado
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}

        {/* ── Tournaments ────────────────────────────────────── */}
        <Paper elevation={0} sx={{ borderRadius: 3, p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <EmojiEventsIcon sx={{ fontSize: 20, color: "text.secondary" }} />
            <Typography variant="h6" fontWeight={700}>Torneos</Typography>
          </Box>

          {tournamentsLoading && (
            <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}><CircularProgress size={24} /></Box>
          )}

          {!tournamentsLoading && tournaments.length === 0 && (
            <Typography variant="body2" color="text.secondary">No hay torneos activos en este momento.</Typography>
          )}

          {tournaments.map((t, idx) => {
            const statusInfo = STATUS_LABEL[t.status] ?? { label: t.status, color: "default" as const };
            return (
              <Box key={t.id}>
                {idx > 0 && <Divider sx={{ my: 1 }} />}
                <Accordion
                  expanded={expandedId === t.id}
                  onChange={handleAccordion(t.id)}
                  elevation={0}
                  disableGutters
                  sx={{ "&:before": { display: "none" }, bgcolor: "transparent" }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, py: 0.5 }}>
                    <Box sx={{ flex: 1, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", pr: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>{t.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(t.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                          {" — "}
                          {new Date(t.endDate).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: 0.75, flexShrink: 0, flexWrap: "wrap" }}>
                        <Chip label={CATEGORY_LABEL[t.category] ?? t.category} size="small" variant="outlined" sx={{ height: 22, fontSize: "0.7rem" }} />
                        {t.format && (
                          <Chip label={FORMAT_LABEL[t.format] ?? t.format} size="small" variant="outlined" sx={{ height: 22, fontSize: "0.7rem" }} />
                        )}
                        <Chip label={statusInfo.label} size="small" color={statusInfo.color} sx={{ height: 22, fontSize: "0.7rem" }} />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0, pt: 0, pb: 1 }}>
                    {expandedId === t.id && <TournamentFixture username={username!} tournamentId={t.id} />}
                  </AccordionDetails>
                </Accordion>
              </Box>
            );
          })}
        </Paper>

      </Container>
    </Box>
  );
}
