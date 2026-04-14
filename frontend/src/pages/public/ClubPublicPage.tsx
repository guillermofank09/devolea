import { useState, useMemo, Fragment, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import StorefrontIcon from "@mui/icons-material/Storefront";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SearchIcon from "@mui/icons-material/Search";
import type { TournamentMatch, Pair, TournamentDetail } from "../../types/Tournament";
import type { DaySchedule } from "../../types/ClubProfile";
import { fetchPublicProfile, fetchPublicTournaments, fetchPublicTournamentDetail, fetchPublicCourts, fetchPublicProfesores } from "../../api/publicService";
import type { PublicBookingSlot, PublicCourt, PublicProfesor } from "../../api/publicService";
import PageLoader from "../../components/common/PageLoader";
import ChampionBanner from "../../components/common/ChampionBanner";

// ─── constants ──────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  PRIMERA: "1ra", SEGUNDA: "2da", TERCERA: "3ra", CUARTA: "4ta",
  QUINTA: "5ta", SEXTA: "6ta", SEPTIMA: "7ma", SIN_CATEGORIA: "Sin categoría",
};

const FORMAT_LABEL: Record<string, string> = {
  ROUND_ROBIN: "Round Robin",
  BRACKET: "Llaves",
};

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "En curso",     color: "#1b5e20", bg: "#e8f5e9" },
  DRAFT:  { label: "Por comenzar", color: "#0d47a1", bg: "#e3f2fd" },
};

// Gradient banner per tournament — cycles through a palette
const BANNER_GRADIENTS = [
  "linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)",
  "linear-gradient(135deg, #6a1b9a 0%, #ce93d8 100%)",
  "linear-gradient(135deg, #e65100 0%, #ffb74d 100%)",
  "linear-gradient(135deg, #1b5e20 0%, #66bb6a 100%)",
  "linear-gradient(135deg, #880e4f 0%, #f48fb1 100%)",
  "linear-gradient(135deg, #004d40 0%, #4db6ac 100%)",
];

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

// ─── live status colors ───────────────────────────────────────────────────────

const LIVE_STATUS_COLORS: Record<string, { stripe: string; border: string; bg: string; text: string; label: string }> = {
  IN_PLAY: { stripe: "#4caf50", border: "#a5d6a7", bg: "#f1f8f1", text: "#2e7d32", label: "En juego" },
  DELAYED:  { stripe: "#ff9800", border: "#ffcc80", bg: "#fff8f0", text: "#e65100", label: "Atrasado" },
  EARLY:    { stripe: "#29b6f6", border: "#90caf9", bg: "#f0f8ff", text: "#1565c0", label: "Adelantado" },
};

// ─── read-only bracket ────────────────────────────────────────────────────────

const MATCH_H = 84;
const MATCH_W = 210;
const CONN_W = 48;
const GAP_1 = 16;
const STROKE = "#d0d0d0";

function ReadOnlyBracket({ matches, sex }: { matches: TournamentMatch[]; sex?: string | null }) {
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

  const lastRound = generatedRounds[generatedRounds.length - 1];
  const finalMatches = matchesByRound[lastRound];
  let champion: Pair | null = null;
  if (lastRound === totalRounds && finalMatches?.length === 1 && finalMatches[0].winnerId != null) {
    const fm = finalMatches[0];
    champion = fm.pair1?.id === fm.winnerId ? (fm.pair1 ?? null) : (fm.pair2 ?? null);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3, alignItems: "flex-start" }}>

      {/* Bracket — horizontally scrollable */}
      <Box sx={{ flex: 1, minWidth: 0, overflowX: "auto", pb: 2, WebkitOverflowScrolling: "touch" }}>
        <Box sx={{ display: "flex", mb: 2, minWidth: totalW }}>
          {allRoundNums.map((round, ri) => (
            <Box key={round} sx={{ width: MATCH_W, flexShrink: 0, textAlign: "center", mr: ri < allRoundNums.length - 1 ? `${CONN_W}px` : 0 }}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1.2, fontSize: "0.68rem" }}>
                {getRoundLabel(round, totalRounds)}
              </Typography>
            </Box>
          ))}
        </Box>
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
                  {isVirt ? <EmptyCard /> : <PublicMatchCard match={slot as TournamentMatch} />}
                </Box>
              );
            })
          )}
        </Box>

      </Box>

      {/* Champion banner — desktop: beside bracket | mobile: below (full screen width) */}
      {champion && (
        <Box sx={{ display: { xs: "none", md: "block" }, flexShrink: 0, width: 220, pt: 4 }}>
          <ChampionBanner champion={champion} sex={sex} />
        </Box>
      )}
      {champion && (
        <Box sx={{ display: { xs: "block", md: "none" }, width: "100%" }}>
          <ChampionBanner champion={champion} sex={sex} compact />
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

function PublicMatchCard({ match }: { match: TournamentMatch }) {
  const isBye = match.status === "BYE";
  const isCompleted = match.status === "COMPLETED";
  const pair1Won = match.winnerId != null && match.pair1?.id === match.winnerId;
  const pair2Won = match.winnerId != null && match.pair2?.id === match.winnerId;
  const live = match.liveStatus ? LIVE_STATUS_COLORS[match.liveStatus] : null;
  const sideColor = live ? live.stripe : isBye ? "#90caf9" : isCompleted ? "#66bb6a" : "#bdbdbd";
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
              {live.label}{match.liveStatus === "DELAYED" && match.delayedUntil ? ` · ${new Date(match.delayedUntil).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : ""}
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
      {isWinner ? <EmojiEventsIcon sx={{ fontSize: 11, color: "#f59e0b", flexShrink: 0 }} /> : <Box sx={{ width: 11, flexShrink: 0 }} />}
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
        const isCompleted = m.status === "COMPLETED";
        return (
          <Paper key={m.id} elevation={0} sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: live ? live.border : isCompleted ? "#c8e6c9" : "divider", bgcolor: live ? live.bg : "background.paper", display: "flex" }}>
            <Box sx={{ width: 4, flexShrink: 0, bgcolor: live ? live.stripe : isCompleted ? "#66bb6a" : "#bdbdbd" }} />
            <Box sx={{ flex: 1, p: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                  <strong>{pairLabel(m.pair1)}</strong>
                  <Typography component="span" variant="caption" color="text.secondary" mx={0.75}>vs</Typography>
                  <strong>{pairLabel(m.pair2)}</strong>
                </Typography>
                {m.result && (
                  <Typography variant="caption" fontWeight={700} color="success.main">{m.result}</Typography>
                )}
                {live && !m.result && (
                  <Typography variant="caption" fontWeight={700} sx={{ color: live.text }}>
                    {live.label}{m.liveStatus === "DELAYED" && m.delayedUntil ? ` · ${new Date(m.delayedUntil).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : ""}
                  </Typography>
                )}
                {!live && m.scheduledAt && !m.result && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(m.scheduledAt).toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {m.court?.name ? ` · ${m.court.name}` : ""}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}

// ─── tournament card ──────────────────────────────────────────────────────────

function TournamentCard({ username, tournament, gradientIndex }: { username: string; tournament: { id: number; name: string; startDate: string; endDate: string; category: string; format?: string; status: string }; gradientIndex: number }) {
  const { data, isLoading } = useQuery<TournamentDetail>({
    queryKey: ["publicTournamentDetail", username, tournament.id],
    queryFn: () => fetchPublicTournamentDetail(username, tournament.id),
  });

  const statusInfo = STATUS_INFO[tournament.status] ?? { label: tournament.status, color: "#555", bg: "#f5f5f5" };
  const gradient = BANNER_GRADIENTS[gradientIndex % BANNER_GRADIENTS.length];
  const isBracket = data?.format === "BRACKET";
  const hasMatches = (data?.matches.length ?? 0) > 0;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
      {/* Banner */}
      <Box sx={{ background: gradient, px: { xs: 2.5, md: 3 }, py: 2.5 }}>
        <Typography variant="h6" fontWeight={800} color="#fff" lineHeight={1.2} sx={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)", mb: 0.5 }}>
          {tournament.name}
        </Typography>
        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", display: "block", mb: 1.25 }}>
          {new Date(tournament.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
          {" — "}
          {new Date(tournament.endDate).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          <Chip
            label={statusInfo.label}
            size="small"
            sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, bgcolor: statusInfo.bg, color: statusInfo.color, border: "none" }}
          />
          <Chip
            label={CATEGORY_LABEL[tournament.category] ?? tournament.category}
            size="small"
            sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600, bgcolor: "rgba(255,255,255,0.20)", color: "#fff" }}
          />
          {tournament.format && (
            <Chip
              label={FORMAT_LABEL[tournament.format] ?? tournament.format}
              size="small"
              sx={{ height: 22, fontSize: "0.7rem", bgcolor: "rgba(255,255,255,0.15)", color: "#fff" }}
            />
          )}
        </Box>
      </Box>

      {/* Fixture */}
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {isLoading && <PageLoader />}
        {!isLoading && data && !hasMatches && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={data.pairs.length > 0 ? 1.5 : 0}>
              {data.pairs.length === 0 ? "El torneo aún no tiene parejas inscriptas." : "El fixture aún no fue generado."}
            </Typography>
            {data.pairs.length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                  Parejas inscriptas
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                  {data.pairs.map(p => (
                    <Chip key={p.id} size="small" label={`${p.player1.name} / ${p.player2.name}`} variant="outlined" />
                  ))}
                </Box>
              </>
            )}
          </Box>
        )}
        {!isLoading && data && hasMatches && (
          isBracket
            ? <ReadOnlyBracket matches={data.matches} sex={data.sex} />
            : <RoundRobinList matches={data.matches} />
        )}
      </Box>
    </Paper>
  );
}

// ─── courts availability ─────────────────────────────────────────────────────

const SLOT_MIN = 60;
const DAY_ABBREVS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function parseHHMM(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}


function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(d.getDate() + n);
  return result;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildWaUrl(phone: string, courtName: string, day: Date, slotMin: number): string {
  const dateLabel = day.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const hours = String(Math.floor(slotMin / 60)).padStart(2, "0");
  const mins  = String(slotMin % 60).padStart(2, "0");
  const msg = `Hola! Quisiera reservar la ${courtName} para el ${dateLabel} a las ${hours}:${mins} hs.`;
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
}

function CourtCalendar({
  court, bookings, businessHours, days, selectedDayIdx, hideCourtName, clubPhone,
}: {
  court: PublicCourt;
  bookings: PublicBookingSlot[];
  businessHours: DaySchedule[];
  days: Date[];
  selectedDayIdx: number;
  hideCourtName?: boolean;
  clubPhone?: string | null;
}) {
  // Per-displayed-day schedule, keyed by actual day-of-week
  const daySchedules = days.map(d => {
    const dow = (d.getDay() + 6) % 7; // 0=Mon…6=Sun
    const schedule = businessHours.find(h => h.day === DAYS[dow]);
    const isClosed = schedule != null && schedule.isOpen === false;
    return {
      isClosed,
      openMin:  isClosed ? null : parseHHMM(schedule?.openTime  ?? "08:00"),
      closeMin: isClosed ? null : parseHHMM(schedule?.closeTime ?? "22:00"),
    };
  });

  // Global open/close range across all business hours for consistent row set
  const allBH = businessHours.filter(h => h.isOpen !== false);
  const globalOpen  = allBH.length ? Math.min(...allBH.map(h => parseHHMM(h.openTime  ?? "08:00"))) : parseHHMM("08:00");
  const globalClose = allBH.length ? Math.max(...allBH.map(h => parseHHMM(h.closeTime ?? "22:00"))) : parseHHMM("22:00");

  const slots: number[] = [];
  for (let m = globalOpen; m < globalClose; m += SLOT_MIN) slots.push(m);

  const occupiedKeys = useMemo(() => {
    const s = new Set<string>();
    bookings
      .filter(b => b.courtId === court.id)
      .forEach(b => {
        const start = new Date(b.startTime);
        const end   = new Date(b.endTime);
        const startMin = start.getHours() * 60 + start.getMinutes();
        const endMin   = end.getHours()   * 60 + end.getMinutes();
        const dk = dateKey(start);
        for (let m = Math.floor(startMin / SLOT_MIN) * SLOT_MIN; m < endMin; m += SLOT_MIN) {
          s.add(`${dk}-${m}`);
        }
      });
    return s;
  }, [bookings, court.id]);

  const todayDk = dateKey(new Date());

  return (
    <Box sx={{ mb: 3 }}>
      {!hideCourtName && (
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75, fontSize: "0.85rem" }}>
          {court.name}
          {court.status === "NOT AVAILABLE" && (
            <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
              No disponible
            </Typography>
          )}
        </Typography>
      )}

      {/* ── Desktop: 3-column grid ── */}
      <Box sx={{ display: { xs: "none", md: "block" }, overflowX: "auto" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: `48px repeat(${days.length}, 1fr)`, minWidth: 320 }}>
          {/* Header row */}
          <Box sx={{ height: 40 }} />
          {days.map(day => {
            const dk = dateKey(day);
            const dow = (day.getDay() + 6) % 7;
            const isToday = dk === todayDk;
            return (
              <Box key={dk} sx={{ height: 40, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: isToday ? "#e3f2fd" : "transparent", borderRadius: "6px 6px 0 0", borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" fontWeight={isToday ? 700 : 500} sx={{ fontSize: "0.75rem", lineHeight: 1.3 }}>{DAY_ABBREVS[dow]}</Typography>
                <Typography variant="caption" sx={{ fontSize: "0.7rem", color: "text.secondary", lineHeight: 1.2 }}>{day.getDate()}</Typography>
              </Box>
            );
          })}
          {/* Slot rows */}
          {slots.map(slotMin => (
            <Fragment key={slotMin}>
              <Box sx={{ height: 52, display: "flex", alignItems: "center", justifyContent: "flex-end", pr: 1, borderRight: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "text.disabled", whiteSpace: "nowrap" }}>
                  {`${String(Math.floor(slotMin / 60)).padStart(2, "0")}:00`}
                </Typography>
              </Box>
              {days.map((day, di) => {
                const dk = dateKey(day);
                const { isClosed, openMin, closeMin } = daySchedules[di];
                const outside = isClosed || openMin == null || closeMin == null || slotMin < openMin || slotMin >= closeMin;
                const occupied = !outside && occupiedKeys.has(`${dk}-${slotMin}`);
                const isToday = dk === todayDk;
                const clickable = clubPhone && !outside && !occupied;
                return (
                  <Box
                    key={dk}
                    component={clickable ? "a" : "div"}
                    href={clickable ? buildWaUrl(clubPhone!, court.name, day, slotMin) : undefined}
                    target={clickable ? "_blank" : undefined}
                    rel={clickable ? "noopener noreferrer" : undefined}
                    sx={{
                      height: 52,
                      bgcolor: outside ? "#f5f5f5" : occupied ? "#ffcdd2" : "#f1f8e9",
                      border: "0.5px solid",
                      borderColor: isToday ? "#bbdefb" : "divider",
                      backgroundImage: outside ? "repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 6px)" : undefined,
                      cursor: clickable ? "pointer" : "default",
                      textDecoration: "none",
                      transition: "filter 0.12s",
                      "&:hover": clickable ? { filter: "brightness(0.92)" } : undefined,
                    }}
                  />
                );
              })}
            </Fragment>
          ))}
        </Box>
      </Box>

      {/* ── Mobile: single-day column (day chosen via chips above) ── */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        {(() => {
          const day = days[selectedDayIdx];
          const dk  = dateKey(day);
          const { isClosed, openMin, closeMin } = daySchedules[selectedDayIdx];
          if (isClosed) {
            return <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>Cerrado este día.</Typography>;
          }
          return (
            <Box sx={{ display: "grid", gridTemplateColumns: "48px 1fr" }}>
              {slots.map(slotMin => {
                const outside = openMin == null || closeMin == null || slotMin < openMin || slotMin >= closeMin;
                const occupied = !outside && occupiedKeys.has(`${dk}-${slotMin}`);
                const clickable = clubPhone && !outside && !occupied;
                return (
                  <Fragment key={slotMin}>
                    <Box sx={{ height: 56, display: "flex", alignItems: "center", justifyContent: "flex-end", pr: 1, borderRight: "1px solid", borderColor: "divider" }}>
                      <Typography variant="caption" sx={{ fontSize: "0.72rem", color: "text.disabled", whiteSpace: "nowrap" }}>
                        {`${String(Math.floor(slotMin / 60)).padStart(2, "0")}:00`}
                      </Typography>
                    </Box>
                    <Box
                      component={clickable ? "a" : "div"}
                      href={clickable ? buildWaUrl(clubPhone!, court.name, day, slotMin) : undefined}
                      target={clickable ? "_blank" : undefined}
                      rel={clickable ? "noopener noreferrer" : undefined}
                      sx={{
                        height: 56,
                        bgcolor: outside ? "#f5f5f5" : occupied ? "#ffcdd2" : "#f1f8e9",
                        border: "0.5px solid",
                        borderColor: "divider",
                        backgroundImage: outside ? "repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 6px)" : undefined,
                        cursor: clickable ? "pointer" : "default",
                        textDecoration: "none",
                        display: "block",
                        transition: "filter 0.12s",
                        "&:hover": clickable ? { filter: "brightness(0.92)" } : undefined,
                      }}
                    />
                  </Fragment>
                );
              })}
            </Box>
          );
        })()}
      </Box>
    </Box>
  );
}

const WINDOW_SIZE = 3;

function CourtsSection({ username, businessHours, clubPhone }: { username: string; businessHours: DaySchedule[]; clubPhone?: string | null }) {
  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [windowStart, setWindowStart] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null);

  const days = Array.from({ length: WINDOW_SIZE }, (_, i) => addDays(windowStart, i));
  const from = windowStart.toISOString();
  const to   = addDays(windowStart, WINDOW_SIZE).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["publicCourts", username, dateKey(windowStart)],
    queryFn:  () => fetchPublicCourts(username, from, to),
    enabled:  !!username,
  });

  // Auto-select the first court once data loads
  useEffect(() => {
    if (data?.courts.length && selectedCourtId === null) {
      setSelectedCourtId(data.courts[0].id);
    }
  }, [data, selectedCourtId]);

  const shiftWindow = (delta: number) => {
    setWindowStart(prev => addDays(prev, delta * WINDOW_SIZE));
    setSelectedDayIdx(0);
  };

  const todayDk    = dateKey(todayStart);
  const isAtToday  = dateKey(windowStart) === todayDk;
  const fromLabel  = days[0].toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  const toLabel    = days[WINDOW_SIZE - 1].toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });

  const activeCourt = data?.courts.find(c => c.id === selectedCourtId) ?? data?.courts[0] ?? null;

  const availableCourtsCount = useMemo(() => {
    if (!data) return 0;
    const selectedDay = days[selectedDayIdx];
    const dk = dateKey(selectedDay);
    const dow = (selectedDay.getDay() + 6) % 7;
    const schedule = businessHours.find(h => h.day === DAYS[dow]);
    if (schedule?.isOpen === false) return 0;
    const openMin  = parseHHMM(schedule?.openTime  ?? "08:00");
    const closeMin = parseHHMM(schedule?.closeTime ?? "22:00");
    const totalSlots = Math.max(0, Math.floor((closeMin - openMin) / SLOT_MIN));
    // count occupied slots per court for this day
    const occupiedByCourtId = new Map<number, number>();
    data.bookings.forEach(b => {
      const start = new Date(b.startTime);
      if (dateKey(start) !== dk) return;
      const end = new Date(b.endTime);
      const startMin = start.getHours() * 60 + start.getMinutes();
      const endMin   = end.getHours()   * 60 + end.getMinutes();
      let count = 0;
      for (let m = Math.floor(startMin / SLOT_MIN) * SLOT_MIN; m < endMin; m += SLOT_MIN) count++;
      occupiedByCourtId.set(b.courtId, (occupiedByCourtId.get(b.courtId) ?? 0) + count);
    });
    return data.courts.filter(c =>
      c.status !== "NOT AVAILABLE" && (occupiedByCourtId.get(c.id) ?? 0) < totalSlots
    ).length;
  }, [data, days, selectedDayIdx, businessHours]);

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <CalendarTodayIcon sx={{ color: "text.secondary", fontSize: 20 }} />
        <Typography variant="h6" fontWeight={800} sx={{ flex: 1, minWidth: 0, fontSize: { xs: "1rem", md: "1.25rem" } }}>Disponibilidad de canchas</Typography>
        {!isLoading && data && (
          <Chip
            label={`${availableCourtsCount} disponible${availableCourtsCount !== 1 ? "s" : ""}`}
            size="small"
            color={availableCourtsCount > 0 ? "success" : "default"}
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: "0.75rem" }}
          />
        )}
        {!isLoading && data && data.courts.length > 1 && (
          <Select
            size="small"
            value={selectedCourtId ?? data.courts[0].id}
            onChange={e => setSelectedCourtId(Number(e.target.value))}
            sx={{ fontSize: "0.85rem", width: { xs: "100%", sm: "auto" }, minWidth: { sm: 140 }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" } }}
          >
            {data.courts.map(c => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        )}
      </Box>

      <Box sx={{ px: { xs: 2, md: 3 }, py: 2.5 }}>
        {/* Day-window navigation */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton size="small" onClick={() => shiftWindow(-1)} disabled={isAtToday} sx={{ opacity: isAtToday ? 0.3 : 1 }}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="body2" fontWeight={600} sx={{ flex: 1, textAlign: "center", textTransform: "capitalize" }}>
              {fromLabel} — {toLabel}
            </Typography>
            <IconButton size="small" onClick={() => shiftWindow(1)}><ChevronRightIcon /></IconButton>
          </Box>
          {!isAtToday && (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Chip
                label="Volver a hoy"
                size="small"
                onClick={() => { setWindowStart(todayStart); setSelectedDayIdx(0); }}
                sx={{ fontSize: "0.72rem", cursor: "pointer" }}
              />
            </Box>
          )}
        </Box>

        {/* Mobile: 3-day selector chips */}
        <Box sx={{ display: { xs: "flex", md: "none" }, gap: 0.75, mb: 2 }}>
          {days.map((day, di) => {
            const dk = dateKey(day);
            const dow = (day.getDay() + 6) % 7;
            const isToday = dk === todayDk;
            const isSelected = di === selectedDayIdx;
            return (
              <Box
                key={di}
                onClick={() => setSelectedDayIdx(di)}
                sx={{ flex: 1, height: 56, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 2, cursor: "pointer", bgcolor: isSelected ? "primary.main" : isToday ? "#e3f2fd" : "grey.100", border: "1px solid", borderColor: isSelected ? "primary.main" : isToday ? "primary.light" : "transparent", transition: "all 150ms ease" }}
              >
                <Typography sx={{ fontSize: "0.62rem", fontWeight: 600, lineHeight: 1.2, color: isSelected ? "#fff" : isToday ? "primary.main" : "text.secondary", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  {DAY_ABBREVS[dow]}
                </Typography>
                <Typography sx={{ fontSize: "1rem", fontWeight: isSelected || isToday ? 700 : 400, lineHeight: 1.3, color: isSelected ? "#fff" : isToday ? "primary.main" : "text.primary" }}>
                  {day.getDate()}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {isLoading && <PageLoader />}

        {!isLoading && data && data.courts.length === 0 && (
          <Typography variant="body2" color="text.secondary">No hay canchas registradas.</Typography>
        )}

        {!isLoading && data && activeCourt && (
          <>
            {data.courts.length === 1 && (
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, fontSize: "0.85rem" }}>
                {activeCourt.name}
                {activeCourt.status === "NOT AVAILABLE" && (
                  <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>No disponible</Typography>
                )}
              </Typography>
            )}
            <CourtCalendar
              court={activeCourt}
              bookings={data.bookings}
              businessHours={businessHours}
              days={days}
              selectedDayIdx={selectedDayIdx}
              hideCourtName
              clubPhone={clubPhone}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1, flexWrap: "wrap" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: "#f1f8e9", border: "0.5px solid #c8e6c9" }} />
                <Typography variant="caption" color="text.secondary">Disponible</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: "#ffcdd2", border: "0.5px solid #ef9a9a" }} />
                <Typography variant="caption" color="text.secondary">Reservado</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: "#f5f5f5", border: "0.5px solid #e0e0e0" }} />
                <Typography variant="caption" color="text.secondary">Fuera de horario</Typography>
              </Box>
              {clubPhone && (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                  Tocá un horario disponible para reservar por WhatsApp
                </Typography>
              )}
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}

// ─── profesores ───────────────────────────────────────────────────────────────

function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

function ProfesorCard({ profesor }: { profesor: PublicProfesor }) {
  const openDays = (profesor.schedule ?? []).filter(d => d.isOpen);

  return (
    <Paper elevation={0} sx={{ borderRadius: 2.5, p: 2.5, border: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
          {profesor.name}
        </Typography>
        {profesor.phone && (
          <Box
            component="a"
            href={waLink(profesor.phone)}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, color: "#25d366", textDecoration: "none", flexShrink: 0, "&:hover": { opacity: 0.8 } }}
          >
            <WhatsAppIcon sx={{ fontSize: 17 }} />
            <Typography variant="body2" fontWeight={500}>{profesor.phone}</Typography>
          </Box>
        )}
      </Box>

      {openDays.length > 0 && (
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
            <AccessTimeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Horarios
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            {openDays.map(d => (
              <Box key={d.day} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                <Typography variant="caption" fontWeight={600} color="text.primary">{d.day}</Typography>
                <Typography variant="caption" color="text.secondary">{d.openTime} – {d.closeTime}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}

function ProfesoresSection({ username }: { username: string }) {
  const { data: profesores = [], isLoading } = useQuery({
    queryKey: ["publicProfesores", username],
    queryFn: () => fetchPublicProfesores(username),
    enabled: !!username,
  });

  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? profesores.filter(p => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : profesores;

  if (!isLoading && profesores.length === 0) return null;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
      <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        <SchoolOutlinedIcon sx={{ color: "text.secondary", fontSize: 20 }} />
        <Typography variant="h6" fontWeight={800} sx={{ flex: 1, fontSize: { xs: "1rem", md: "1.25rem" } }}>Profesores</Typography>
        {!isLoading && profesores.length > 1 && (
          <TextField
            size="small"
            placeholder="Buscar profesor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: { xs: "100%", sm: 200 }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" } }}
          />
        )}
      </Box>

      <Box sx={{ px: { xs: 2, md: 3 }, py: 2.5 }}>
        {isLoading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No se encontraron profesores con ese nombre.
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 2 }}>
            {filtered.map(p => <ProfesorCard key={p.id} profesor={p} />)}
          </Box>
        )}
      </Box>
    </Paper>
  );
}


// ─── navigation items ─────────────────────────────────────────────────────────

interface PublicNavItem {
  id: string;
  label: string;
  Icon: React.ComponentType<{ sx?: object }>;
}

const ALL_NAV_ITEMS: PublicNavItem[] = [
  { id: "section-club",       label: "Club",       Icon: StorefrontIcon },
  { id: "section-torneos",    label: "Torneos",    Icon: EmojiEventsIcon },
  { id: "section-canchas",    label: "Canchas",    Icon: SportsTennisIcon },
  { id: "section-profesores", label: "Profesores", Icon: SchoolOutlinedIcon },
];

// ─── public page sidebar — nav only (desktop) ────────────────────────────────

interface PublicSidebarProps {
  items: PublicNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

function PublicPageSidebar({ items, activeId, onSelect }: PublicSidebarProps) {
  const desktopItems = items.filter(item => item.id !== "section-club");
  return (
    <Box
      sx={{
        width: 200,
        flexShrink: 0,
        bgcolor: "#111",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Section navigation */}
      <Box sx={{ px: 1.5, pt: 3, pb: 2, display: "flex", flexDirection: "column", gap: "3px" }}>
        {desktopItems.map(({ id, label, Icon }) => {
          const active = activeId === id;
          return (
            <Box
              key={id}
              component="button"
              onClick={() => onSelect(id)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: "14px",
                py: "11px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                bgcolor: active ? "#F5AD27" : "transparent",
                color: active ? "#111" : "#6b7a99",
                fontWeight: active ? 700 : 500,
                fontSize: "14px",
                letterSpacing: "0.1px",
                transition: "background 150ms ease, color 150ms ease",
                "&:hover": active
                  ? { bgcolor: "#e09b18" }
                  : { bgcolor: "rgba(255,255,255,0.05)", color: "#e8eaf0" },
              }}
            >
              <Box
                sx={{
                  width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, borderRadius: "9px",
                  bgcolor: active ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.04)",
                  transition: "background 150ms ease",
                }}
              >
                <Icon sx={{ fontSize: 17 }} />
              </Box>
              {label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── club info panel (desktop right) ─────────────────────────────────────────

interface ClubInfoPanelProps {
  clubName: string;
  address?: string;
  logoBase64?: string | null;
  mapUrl: string | null;
  businessHours: Array<{ day: string; isOpen?: boolean; openTime?: string; closeTime?: string }>;
}

function ClubInfoPanel({ clubName, address, logoBase64, mapUrl, businessHours }: ClubInfoPanelProps) {
  const navigate = useNavigate();
  const DIVIDER = "rgba(255,255,255,0.08)";
  const MUTED   = "#6b7a99";
  const TEXT    = "#e8eaf0";
  return (
    <Box
      sx={{
        width: 270,
        flexShrink: 0,
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        borderLeft: `1px solid ${DIVIDER}`,
        bgcolor: "#111111",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.10) transparent",
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": { background: "rgba(255,255,255,0.10)", borderRadius: "4px" },
      }}
    >
      {/* Club identity */}
      <Box sx={{ px: 3, pt: 3.5, pb: 2.5, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <Box
          onClick={() => navigate("/")}
          sx={{ cursor: "pointer", mb: 2, "&:hover": { opacity: 0.85 }, transition: "opacity 150ms ease" }}
        >
          {logoBase64 ? (
            <Box
              component="img"
              src={logoBase64}
              alt="logo"
              sx={{ width: 80, height: 80, borderRadius: 3, objectFit: "contain", border: `1px solid ${DIVIDER}`, display: "block", bgcolor: "rgba(255,255,255,0.04)" }}
            />
          ) : (
            <Box sx={{ width: 80, height: 80, borderRadius: 3, bgcolor: "#F5AD27", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SportsTennisIcon sx={{ fontSize: 38, color: "#111" }} />
            </Box>
          )}
        </Box>
        <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.25, color: TEXT }}>
          {clubName || "Club de Pádel"}
        </Typography>
        {address && (
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 0.5, mt: 0.75 }}>
            <LocationOnIcon sx={{ fontSize: 13, color: MUTED, mt: "2px", flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: MUTED, lineHeight: 1.4 }}>{address}</Typography>
          </Box>
        )}
      </Box>

      {/* Map */}
      {mapUrl && (
        <>
          <Box sx={{ mx: 2.5, borderTop: `1px solid ${DIVIDER}` }} />
          <Box sx={{ mx: 2.5, my: 2, borderRadius: 2, overflow: "hidden", height: 160, flexShrink: 0, border: `1px solid ${DIVIDER}` }}>
            <Box component="iframe" src={mapUrl} title="Ubicación del club" sx={{ width: "100%", height: "100%", border: 0, display: "block" }} loading="lazy" />
          </Box>
        </>
      )}

      {/* Business hours */}
      {businessHours.some(h => h.isOpen) && (
        <>
          <Box sx={{ mx: 2.5, borderTop: `1px solid ${DIVIDER}` }} />
          <Box sx={{ px: 2.5, py: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <AccessTimeIcon sx={{ fontSize: 15, color: MUTED }} />
              <Typography sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.68rem", color: MUTED }}>
                Horarios
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
              {DAYS.map(day => {
                const sched = businessHours.find(h => h.day === day);
                if (!sched?.isOpen) return null;
                return (
                  <Box key={day} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.78rem", color: TEXT }}>{day.slice(0, 3)}</Typography>
                    <Typography sx={{ fontSize: "0.78rem", color: MUTED }}>{sched.openTime}–{sched.closeTime}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}

// ─── mobile bottom nav ────────────────────────────────────────────────────────

function MobileBottomNav({ items, activeId, onSelect }: { items: PublicNavItem[]; activeId: string; onSelect: (id: string) => void }) {
  if (!items.length) return null;
  return (
    <Box
      component="nav"
      sx={{
        display: { xs: "flex", md: "none" },
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        bgcolor: "#111",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.35)",
      }}
    >
      {items.map(({ id, label, Icon }) => {
        const active = activeId === id;
        return (
          <Box
            key={id}
            component="button"
            onClick={() => onSelect(id)}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.4,
              py: 1.25,
              border: "none",
              bgcolor: "transparent",
              cursor: "pointer",
              color: active ? "#F5AD27" : "#6b7a99",
              transition: "color 150ms ease",
            }}
          >
            <Icon sx={{ fontSize: 22 }} />
            <Typography sx={{ fontSize: "0.65rem", fontWeight: active ? 700 : 500, lineHeight: 1, color: "inherit" }}>
              {label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── mobile club info section ────────────────────────────────────────────────

function MobileClubInfoSection({ address, mapUrl, businessHours, phone }: {
  address?: string;
  mapUrl: string | null;
  businessHours: Array<{ day: string; isOpen?: boolean; openTime?: string; closeTime?: string }>;
  phone?: string | null;
}) {
  const DIVIDER = "rgba(255,255,255,0.08)";
  const MUTED   = "#6b7a99";
  const TEXT    = "#e8eaf0";
  return (
    <Box sx={{ borderRadius: 3, overflow: "hidden", bgcolor: "#111111", border: `1px solid ${DIVIDER}` }}>
      {/* Map */}
      {mapUrl && (
        <Box sx={{ height: 200, borderBottom: `1px solid ${DIVIDER}` }}>
          <Box component="iframe" src={mapUrl} title="Ubicación del club" sx={{ width: "100%", height: "100%", border: 0, display: "block" }} loading="lazy" />
        </Box>
      )}

      {/* Address */}
      {address && (
        <Box sx={{ px: 2.5, py: 1.75, display: "flex", alignItems: "center", gap: 1.25, borderBottom: `1px solid ${DIVIDER}` }}>
          <LocationOnIcon sx={{ fontSize: 17, color: MUTED, flexShrink: 0 }} />
          <Typography sx={{ fontSize: "0.88rem", color: TEXT, lineHeight: 1.4 }}>{address}</Typography>
        </Box>
      )}

      {/* Phone / WhatsApp */}
      {phone && (
        <Box
          component="a"
          href={`https://wa.me/${phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ px: 2.5, py: 1.75, display: "flex", alignItems: "center", gap: 1.25, borderBottom: `1px solid ${DIVIDER}`, textDecoration: "none" }}
        >
          <WhatsAppIcon sx={{ fontSize: 17, color: "#25d366", flexShrink: 0 }} />
          <Typography sx={{ fontSize: "0.88rem", color: "#25d366" }}>{phone}</Typography>
        </Box>
      )}

      {/* Business hours */}
      {businessHours.some(h => h.isOpen) && (
        <Box sx={{ px: 2.5, py: 2.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <AccessTimeIcon sx={{ fontSize: 15, color: MUTED }} />
            <Typography sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.68rem", color: MUTED }}>
              Horarios
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {DAYS.map(day => {
              const sched = businessHours.find(h => h.day === day);
              if (!sched?.isOpen) return null;
              return (
                <Box key={day} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: TEXT }}>{day}</Typography>
                  <Typography sx={{ fontSize: "0.85rem", color: MUTED }}>{sched.openTime}–{sched.closeTime}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─── mobile club header ───────────────────────────────────────────────────────

function MobileClubHeader({ clubName, address, logoBase64 }: { clubName: string; address?: string; logoBase64?: string | null }) {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        display: { xs: "flex", md: "none" },
        alignItems: "center",
        gap: 2,
        px: 2,
        py: 1.75,
        bgcolor: "#111",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Box
        onClick={() => navigate("/")}
        sx={{ cursor: "pointer", flexShrink: 0, "&:hover": { opacity: 0.85 }, transition: "opacity 150ms ease" }}
      >
        {logoBase64 ? (
          <Box component="img" src={logoBase64} alt="logo" sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: "contain", border: "1px solid rgba(255,255,255,0.1)", display: "block", bgcolor: "#1a1a1a" }} />
        ) : (
          <Box sx={{ width: 40, height: 40, borderRadius: 1.5, bgcolor: "#F5AD27", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SportsTennisIcon sx={{ fontSize: 20, color: "#111" }} />
          </Box>
        )}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#e8eaf0", lineHeight: 1.2 }} noWrap>
          {clubName || "Club de Pádel"}
        </Typography>
        {address && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.2 }}>
            <LocationOnIcon sx={{ fontSize: 12, color: "#6b7a99", flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: "#6b7a99" }} noWrap>{address}</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ClubPublicPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Detect sub-route: /:username/canchas, /:username/torneos, /:username/profesores
  const pathParts = location.pathname.split("/").filter(Boolean);
  const subSection = pathParts.length >= 2 ? pathParts[1] as "canchas" | "torneos" | "profesores" : null;

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

  const visibleNavItems = useMemo(() => {
    if (!profile) return ALL_NAV_ITEMS;
    return ALL_NAV_ITEMS.filter(({ id }) => {
      if (id === "section-torneos")    return profile.showTournaments ?? true;
      if (id === "section-canchas")    return profile.showCourts      ?? true;
      if (id === "section-profesores") return profile.showProfesores  ?? true;
      return true;
    });
  }, [profile]);

  // On sub-routes the active section is fixed; on the full page it's scroll-driven
  const activeSectionForSubRoute =
    subSection === "canchas"    ? "section-canchas" :
    subSection === "torneos"    ? "section-torneos" :
    subSection === "profesores" ? "section-profesores" : null;

  const [activeSection, setActiveSection] = useState(
    () => activeSectionForSubRoute ?? visibleNavItems[0]?.id ?? "section-torneos"
  );

  useEffect(() => {
    if (activeSectionForSubRoute) {
      setActiveSection(activeSectionForSubRoute);
    } else {
      setActiveSection(visibleNavItems[0]?.id ?? "section-torneos");
    }
  }, [activeSectionForSubRoute, visibleNavItems]);

  // IntersectionObserver only on full page (no sub-route)
  useEffect(() => {
    if (!profile || subSection) return;
    const observers = visibleNavItems.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: "-10% 0px -85% 0px", threshold: 0 },
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, [profile, visibleNavItems, subSection]);

  // On sub-routes navigate to the section URL; on full page scroll
  function handleNavSelect(id: string) {
    if (subSection) {
      if (id === "section-torneos")         navigate(`/${username}/torneos`);
      else if (id === "section-canchas")    navigate(`/${username}/canchas`);
      else if (id === "section-profesores") navigate(`/${username}/profesores`);
      else                                  navigate(`/${username}`);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  if (profileLoading) return <PageLoader />;

  if (profileError || !profile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: "#111" }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight={700} mb={1} sx={{ color: "#e8eaf0" }}>Club no encontrado</Typography>
          <Typography sx={{ color: "#6b7a99" }}>No existe un club con ese nombre de usuario.</Typography>
        </Box>
      </Box>
    );
  }

  const mapUrl = profile.latitude && profile.longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${profile.longitude - 0.006}%2C${profile.latitude - 0.004}%2C${profile.longitude + 0.006}%2C${profile.latitude + 0.004}&layer=mapnik&marker=${profile.latitude}%2C${profile.longitude}`
    : null;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.50" }}>

      {/* ── Left sidebar — nav only (desktop) ── */}
      <PublicPageSidebar
        items={visibleNavItems}
        activeId={activeSection}
        onSelect={handleNavSelect}
      />

      {/* ── Main content ── */}
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Mobile club header */}
        <MobileClubHeader
          clubName={profile.clubName}
          address={profile.address}
          logoBase64={profile.logoBase64}
        />

        {/* Scrollable body */}
        <Box sx={{ flex: 1, px: { xs: 1.5, md: 4 }, py: { xs: 2, md: 4 }, pb: { xs: "calc(72px + env(safe-area-inset-bottom, 0px))", md: 4 } }}>

          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 5 } }}>

            {/* Club info — mobile only */}
            {!subSection && (
              <Box id="section-club" sx={{ display: { xs: "block", md: "none" }, scrollMarginTop: "16px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <Box sx={{ width: 30, height: 30, borderRadius: 2, bgcolor: "#F5AD27", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <StorefrontIcon sx={{ fontSize: 17, color: "#111" }} />
                  </Box>
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1.1rem" }}>Información del club</Typography>
                </Box>
                <MobileClubInfoSection
                  address={profile.address}
                  mapUrl={mapUrl}
                  businessHours={profile.businessHours}
                  phone={profile.phone}
                />
              </Box>
            )}

            {/* Torneos */}
            {(!subSection || subSection === "torneos") && (profile.showTournaments ?? true) && (
              <Box id="section-torneos" sx={{ scrollMarginTop: "16px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: { xs: 2, md: 2.5 } }}>
                  <Box sx={{ width: { xs: 30, md: 36 }, height: { xs: 30, md: 36 }, borderRadius: 2, bgcolor: "#F5AD27", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <EmojiEventsIcon sx={{ fontSize: { xs: 17, md: 20 }, color: "#111" }} />
                  </Box>
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}>Torneos</Typography>
                </Box>

                {tournamentsLoading && <PageLoader />}

                {!tournamentsLoading && tournaments.length === 0 && (
                  <Paper elevation={0} sx={{ borderRadius: 3, p: { xs: 3, md: 5 }, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
                    <EmojiEventsIcon sx={{ fontSize: { xs: 36, md: 44 }, color: "text.disabled", mb: 1.5 }} />
                    <Typography variant="body1" color="text.secondary">No hay torneos activos en este momento.</Typography>
                  </Paper>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
                  {tournaments.map((t, idx) => (
                    <TournamentCard key={t.id} username={username!} tournament={t} gradientIndex={idx} />
                  ))}
                </Box>
              </Box>
            )}

            {/* Canchas */}
            {(!subSection || subSection === "canchas") && (profile.showCourts ?? true) && (
              <Box id="section-canchas" sx={{ scrollMarginTop: "16px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: { xs: 2, md: 2.5 } }}>
                  <Box sx={{ width: { xs: 30, md: 36 }, height: { xs: 30, md: 36 }, borderRadius: 2, bgcolor: "#F5AD27", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <SportsTennisIcon sx={{ fontSize: { xs: 17, md: 20 }, color: "#111" }} />
                  </Box>
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}>Canchas</Typography>
                </Box>
                <CourtsSection username={username!} businessHours={profile.businessHours} clubPhone={profile.phone} />
              </Box>
            )}

            {/* Profesores */}
            {(!subSection || subSection === "profesores") && (profile.showProfesores ?? true) && (
              <Box id="section-profesores" sx={{ scrollMarginTop: "16px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: { xs: 2, md: 2.5 } }}>
                  <Box sx={{ width: { xs: 30, md: 36 }, height: { xs: 30, md: 36 }, borderRadius: 2, bgcolor: "#F5AD27", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <SchoolOutlinedIcon sx={{ fontSize: { xs: 17, md: 20 }, color: "#111" }} />
                  </Box>
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" } }}>Profesores</Typography>
                </Box>
                <ProfesoresSection username={username!} />
              </Box>
            )}

          </Box>
        </Box>
      </Box>

      {/* ── Right panel — club info (desktop) ── */}
      <ClubInfoPanel
        clubName={profile.clubName}
        address={profile.address}
        logoBase64={profile.logoBase64}
        mapUrl={mapUrl}
        businessHours={profile.businessHours}
      />

      {/* ── Mobile bottom nav ── */}
      <MobileBottomNav items={visibleNavItems} activeId={activeSection} onSelect={handleNavSelect} />

    </Box>
  );
}
