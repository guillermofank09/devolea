import { useState, useMemo, Fragment, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Avatar,
  Box,
  Button,
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
import type { TournamentMatch, Pair, TournamentDetail, TournamentTeam } from "../../types/Tournament";
import { isTeamSport } from "../tournaments/AddEditTournament";
import type { DaySchedule } from "../../types/ClubProfile";
import { fetchPublicProfile, fetchPublicTournaments, fetchPublicTournamentDetail, fetchPublicCourts, fetchPublicProfesores } from "../../api/publicService";
import type { PublicBookingSlot, PublicCourt, PublicProfesor } from "../../api/publicService";
import PageLoader from "../../components/common/PageLoader";
import BracketView from "../tournaments/BracketView";
import { trackEvent } from "../../lib/analytics";

// ─── constants ──────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  PRIMERA: "1ra", SEGUNDA: "2da", TERCERA: "3ra", CUARTA: "4ta",
  QUINTA: "5ta", SEXTA: "6ta", SEPTIMA: "7ma", SIN_CATEGORIA: "Sin categoría",
};

const FORMAT_LABEL: Record<string, string> = {
  ROUND_ROBIN: "Round Robin",
  BRACKET: "Llaves",
};

function getTournamentStatus(startDate: string, endDate: string): { label: string; color: string; bg: string } {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  if (now < start) return { label: "Diagramado", color: "#64748b", bg: "#f1f5f9" };
  if (now > end)   return { label: "Finalizado",  color: "#475569", bg: "#f8fafc" };
  return               { label: "En Curso",    color: "#059669", bg: "#ecfdf5" };
}

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// ─── colors ─────────────────────────────────────────────────────────────────

const COLORS = {
  panelBg: "#0f172a", // Slate 900
  contentBg: "#f8fafc", // Slate 50
  accent: "#f5ad27",
  muted: "#64748b",
  text: "#1e293b",
  border: "rgba(255,255,255,0.06)",
  lightBorder: "#e2e8f0",
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function pairLabel(pair: Pair | null | undefined): string {
  if (!pair) return "BYE";
  const p1 = pair.player1.name.split(" ")[0];
  if (!pair.player2) return p1;
  const p2 = pair.player2.name.split(" ")[0];
  return `${p1} / ${p2}`;
}

function teamLabel(team: TournamentTeam | null | undefined): string {
  if (!team) return "BYE";
  return team.equipo.name;
}

// ─── live status colors ───────────────────────────────────────────────────────

const LIVE_STATUS_COLORS: Record<string, { stripe: string; border: string; bg: string; text: string; label: string }> = {
  IN_PLAY: { stripe: "#10b981", border: "#a7f3d0", bg: "#f0fdf4", text: "#065f46", label: "En juego" },
  DELAYED:  { stripe: "#f59e0b", border: "#fde68a", bg: "#fffbeb", text: "#92400e", label: "Atrasado" },
  EARLY:    { stripe: "#3b82f6", border: "#bfdbfe", bg: "#eff6ff", text: "#1e40af", label: "Adelantado" },
};

// ─── round-robin match list ───────────────────────────────────────────────────

function RoundRobinList({ matches, teamMode = false }: { matches: TournamentMatch[]; teamMode?: boolean }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {matches.map(m => {
        const live = m.liveStatus ? LIVE_STATUS_COLORS[m.liveStatus] : null;
        const isCompleted = m.status === "COMPLETED";
        const label1 = teamMode ? teamLabel(m.team1) : pairLabel(m.pair1);
        const label2 = teamMode ? teamLabel(m.team2) : pairLabel(m.pair2);
        return (
          <Paper
            key={m.id}
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid",
              borderColor: live ? live.border : isCompleted ? "#d1fae5" : "#e2e8f0",
              bgcolor: live ? live.bg : isCompleted ? "#f0fdf4" : "background.paper",
              display: "flex",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-1px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
              }
            }}
          >
            <Box sx={{ width: 6, flexShrink: 0, bgcolor: live ? live.stripe : isCompleted ? "#10b981" : "#cbd5e1" }} />
            <Box sx={{ flex: 1, p: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: COLORS.text }}>
                    {label1}
                    <Typography component="span" variant="caption" sx={{ mx: 1, color: "text.disabled", fontWeight: 400 }}>vs</Typography>
                    {label2}
                  </Typography>
                </Box>
                {m.result && (
                  <Box sx={{ px: 1.5, py: 0.5, bgcolor: "#d1fae5", borderRadius: 1.5 }}>
                    <Typography variant="caption" fontWeight={800} sx={{ color: "#065f46", letterSpacing: 0.5 }}>{m.result}</Typography>
                  </Box>
                )}
                {live && !m.result && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: live.stripe, animation: "pulse 2s infinite" }} />
                    <Typography variant="caption" fontWeight={700} sx={{ color: live.text, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {live.label}{m.liveStatus === "DELAYED" && m.delayedUntil ? ` · ${new Date(m.delayedUntil).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : ""}
                    </Typography>
                  </Box>
                )}
                {!live && m.scheduledAt && !m.result && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "text.secondary" }}>
                    <AccessTimeIcon sx={{ fontSize: 14 }} />
                    <Typography variant="caption" fontWeight={500}>
                      {new Date(m.scheduledAt).toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {m.court?.name ? ` · ${m.court.name}` : ""}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>
        );
      })}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
    </Box>
  );
}

// ─── tournament card ──────────────────────────────────────────────────────────

// Paleta basada en el tono oscuro de la app (#0f172a), con destinos sutilmente distintos
const TOURNAMENT_GRADIENTS = [
  "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",  // azul oceáno
  "linear-gradient(135deg, #0f172a 0%, #134e4a 100%)",  // verde esmeralda
  "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",  // índigo profundo
  "linear-gradient(135deg, #0f172a 0%, #3d1e08 100%)",  // ámbar oscuro
  "linear-gradient(135deg, #0f172a 0%, #2e1065 100%)",  // violeta oscuro
  "linear-gradient(135deg, #0f172a 0%, #0a2e1a 100%)",  // verde bosque
];

function TournamentCard({ username, tournament, index }: { username: string; tournament: { id: number; name: string; startDate: string; endDate: string; category: string; format?: string; status: string; sex?: string; sport?: string }; index: number }) {
  const { data, isLoading } = useQuery<TournamentDetail>({
    queryKey: ["publicTournamentDetail", username, tournament.id],
    queryFn: () => fetchPublicTournamentDetail(username, tournament.id),
  });

  const statusInfo = getTournamentStatus(tournament.startDate, tournament.endDate);
  const gradient = TOURNAMENT_GRADIENTS[index % TOURNAMENT_GRADIENTS.length];
  const isBracket = data?.format === "BRACKET";
  const hasMatches = (data?.matches.length ?? 0) > 0;
  const teamMode = isTeamSport(data?.sport ?? tournament.sport ?? "");
  const hasEntrants = teamMode ? (data?.teams?.length ?? 0) > 0 : (data?.pairs.length ?? 0) > 0;
  const unit = teamMode ? "equipos" : "parejas";

  return (
    <Paper elevation={0} sx={{ borderRadius: 4, overflow: "clip", border: "1px solid", borderColor: COLORS.lightBorder, bgcolor: "#fff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)" }}>
      {/* Banner */}
      <Box sx={{ background: gradient, px: { xs: 3, md: 4 }, py: 3.5, position: "relative", borderRadius: "16px 16px 0 0" }}>
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography variant="h5" fontWeight={800} color="#fff" lineHeight={1.2} sx={{ mb: 1, letterSpacing: "-0.02em" }}>
            {tournament.name}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "rgba(255,255,255,0.8)", mb: 2 }}>
            <CalendarTodayIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption" fontWeight={500} sx={{ letterSpacing: 0.5 }}>
              {new Date(tournament.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
              {" — "}
              {new Date(tournament.endDate).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip
              label={statusInfo.label}
              size="small"
              sx={{ height: 24, fontSize: "0.7rem", fontWeight: 700, bgcolor: statusInfo.bg, color: statusInfo.color, border: "none", px: 0.5 }}
            />
            <Chip
              label={CATEGORY_LABEL[tournament.category] ?? tournament.category}
              size="small"
              sx={{ height: 24, fontSize: "0.7rem", fontWeight: 700, bgcolor: "rgba(255,255,255,0.2)", color: "#fff", border: "none", px: 0.5, backdropFilter: "blur(4px)" }}
            />
            {tournament.format && (
              <Chip
                label={FORMAT_LABEL[tournament.format] ?? tournament.format}
                size="small"
                sx={{ height: 24, fontSize: "0.7rem", fontWeight: 700, bgcolor: "rgba(255,255,255,0.15)", color: "#fff", border: "none", px: 0.5 }}
              />
            )}
          </Box>
        </Box>
        {/* Decorative element */}
        <EmojiEventsIcon sx={{ position: "absolute", right: -20, bottom: -20, fontSize: 120, color: "rgba(255,255,255,0.08)", transform: "rotate(-15deg)" }} />
      </Box>

      {/* Fixture */}
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        {isLoading && <PageLoader />}
        {!isLoading && data && !hasMatches && (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="body2" color="text.secondary" mb={hasEntrants ? 2 : 0}>
              {!hasEntrants ? `El torneo aún no tiene ${unit} inscriptos.` : "El fixture aún no fue generado."}
            </Typography>
            {hasEntrants && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 1, mb: 1.5, display: "block" }}>
                  {teamMode ? "Equipos inscriptos" : "Parejas inscriptas"}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                  {teamMode
                    ? (data.teams ?? []).map(t => (
                        <Chip key={t.id} size="small" label={t.equipo.name} variant="outlined" sx={{ borderRadius: 2, borderColor: COLORS.lightBorder }} />
                      ))
                    : data.pairs.map(p => (
                        <Chip key={p.id} size="small" label={p.player2 ? `${p.player1.name} / ${p.player2.name}` : p.player1.name} variant="outlined" sx={{ borderRadius: 2, borderColor: COLORS.lightBorder }} />
                      ))
                  }
                </Box>
              </Box>
            )}
          </Box>
        )}
        {!isLoading && data && hasMatches && (
          <Box sx={{ overflow: "auto", WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}>
            {isBracket
              ? <BracketView matches={data.matches} sex={data.sex} readOnly teamMode={teamMode} />
              : <RoundRobinList matches={data.matches} teamMode={teamMode} />
            }
          </Box>
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
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: COLORS.text }}>
          {court.name}
          {court.status === "NOT AVAILABLE" && (
            <Chip label="No disponible" size="small" color="warning" sx={{ ml: 1.5, height: 20, fontSize: "0.65rem", fontWeight: 700 }} />
          )}
        </Typography>
      )}

      {/* ── Desktop: Grid ── */}
      <Box sx={{ display: { xs: "none", md: "block" }, overflowX: "auto", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: `60px repeat(${days.length}, 1fr)`, minWidth: 400 }}>
          {/* Header row */}
          <Box sx={{ height: 50, bgcolor: "grey.50" }} />
          {days.map(day => {
            const dk = dateKey(day);
            const dow = (day.getDay() + 6) % 7;
            const isToday = dk === todayDk;
            return (
              <Box key={dk} sx={{ height: 50, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", bgcolor: isToday ? "#eff6ff" : "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography variant="caption" fontWeight={isToday ? 800 : 600} sx={{ fontSize: "0.75rem", color: isToday ? "primary.main" : "text.primary" }}>{DAY_ABBREVS[dow]}</Typography>
                <Typography variant="caption" sx={{ fontSize: "0.7rem", color: isToday ? "primary.main" : "text.secondary", opacity: 0.8 }}>{day.getDate()}</Typography>
              </Box>
            );
          })}
          {/* Slot rows */}
          {slots.map(slotMin => (
            <Fragment key={slotMin}>
              <Box sx={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
                <Typography variant="caption" sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary" }}>
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
                    onClick={clickable ? () => trackEvent("whatsapp_reserva", { cancha: court.name }) : undefined}
                    sx={{
                      height: 60,
                      bgcolor: outside ? "#f8fafc" : occupied ? "#fee2e2" : "#f0fdf4",
                      border: "0.5px solid",
                      borderColor: isToday ? "#bfdbfe" : "divider",
                      backgroundImage: outside ? "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.02) 4px, rgba(0,0,0,0.02) 8px)" : undefined,
                      cursor: clickable ? "pointer" : "default",
                      transition: "all 0.15s",
                      "&:hover": clickable ? { bgcolor: "#dcfce7", filter: "brightness(0.98)" } : undefined,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {occupied && <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 700, fontSize: "0.6rem", textTransform: "uppercase" }}>Reservado</Typography>}
                    {clickable && (
                      <Box sx={{ opacity: 0, transition: "opacity 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
                        <WhatsAppIcon sx={{ fontSize: 16, color: "#10b981" }} />
                        <Typography variant="caption" sx={{ color: "#059669", fontWeight: 700, fontSize: "0.55rem" }}>RESERVAR</Typography>
                      </Box>
                    )}
                    <style>{`
                      div:hover > .MuiBox-root { opacity: 1 !important; }
                    `}</style>
                  </Box>
                );
              })}
            </Fragment>
          ))}
        </Box>
      </Box>

      {/* ── Mobile: column ── */}
      <Box sx={{ display: { xs: "block", md: "none" }, borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        {(() => {
          const day = days[selectedDayIdx];
          const dk  = dateKey(day);
          const { isClosed, openMin, closeMin } = daySchedules[selectedDayIdx];
          if (isClosed) {
            return (
              <Box sx={{ py: 4, textAlign: "center", bgcolor: "#f8fafc" }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Cerrado este día.</Typography>
              </Box>
            );
          }
          return (
            <Box sx={{ display: "grid", gridTemplateColumns: "60px 1fr" }}>
              {slots.map(slotMin => {
                const outside = openMin == null || closeMin == null || slotMin < openMin || slotMin >= closeMin;
                const occupied = !outside && occupiedKeys.has(`${dk}-${slotMin}`);
                const clickable = clubPhone && !outside && !occupied;
                return (
                  <Fragment key={slotMin}>
                    <Box sx={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
                      <Typography variant="caption" sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary" }}>
                        {`${String(Math.floor(slotMin / 60)).padStart(2, "0")}:00`}
                      </Typography>
                    </Box>
                    <Box
                      component={clickable ? "a" : "div"}
                      href={clickable ? buildWaUrl(clubPhone!, court.name, day, slotMin) : undefined}
                      target={clickable ? "_blank" : undefined}
                      rel={clickable ? "noopener noreferrer" : undefined}
                      onClick={clickable ? () => trackEvent("whatsapp_reserva", { cancha: court.name }) : undefined}
                      sx={{
                        height: 64,
                        bgcolor: outside ? "#f8fafc" : occupied ? "#fee2e2" : "#f0fdf4",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        backgroundImage: outside ? "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.02) 4px, rgba(0,0,0,0.02) 8px)" : undefined,
                        cursor: clickable ? "pointer" : "default",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        px: 2,
                        gap: 1.5
                      }}
                    >
                      {occupied ? (
                        <>
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ef4444" }} />
                          <Typography variant="body2" sx={{ color: "#ef4444", fontWeight: 600 }}>Reservado</Typography>
                        </>
                      ) : outside ? (
                        <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 500 }}>No disponible</Typography>
                      ) : (
                        <>
                          <WhatsAppIcon sx={{ fontSize: 18, color: "#10b981" }} />
                          <Typography variant="body2" sx={{ color: "#059669", fontWeight: 600 }}>Disponible — Toca para reservar</Typography>
                        </>
                      )}
                    </Box>
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
    <Paper elevation={0} sx={{ borderRadius: 4, overflow: "hidden", border: "1px solid", borderColor: COLORS.lightBorder, bgcolor: "#fff", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
      <Box sx={{ px: { xs: 2.5, md: 4 }, py: 3, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
          <CalendarTodayIcon sx={{ color: "primary.main", fontSize: 24 }} />
          <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: "1.1rem", md: "1.25rem" }, letterSpacing: "-0.01em" }}>Disponibilidad</Typography>
          {!isLoading && data && (
            <Chip
              label={`${availableCourtsCount} disponible${availableCourtsCount !== 1 ? "s" : ""}`}
              size="small"
              color={availableCourtsCount > 0 ? "success" : "default"}
              sx={{ fontWeight: 700, fontSize: "0.7rem", height: 24 }}
            />
          )}
        </Box>
        {!isLoading && data && data.courts.length > 1 && (
          <Select
            size="small"
            value={selectedCourtId ?? data.courts[0].id}
            onChange={e => setSelectedCourtId(Number(e.target.value))}
            sx={{
              fontSize: "0.85rem", fontWeight: 600, borderRadius: 2,
              width: { xs: "100%", sm: "auto" }, minWidth: { sm: 160 },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "divider" }
            }}
          >
            {data.courts.map(c => (
              <MenuItem key={c.id} value={c.id} sx={{ fontSize: "0.85rem" }}>{c.name}</MenuItem>
            ))}
          </Select>
        )}
      </Box>

      <Box sx={{ px: { xs: 2.5, md: 4 }, py: 3.5 }}>
        {/* Navigation */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, p: 1, bgcolor: "grey.50", borderRadius: 3 }}>
            <IconButton size="small" onClick={() => shiftWindow(-1)} disabled={isAtToday} sx={{ bgcolor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", "&:disabled": { opacity: 0.3 } }}>
              <ChevronLeftIcon />
            </IconButton>
            <Typography variant="body2" fontWeight={800} sx={{ textTransform: "uppercase", letterSpacing: 1, fontSize: "0.75rem", color: "text.secondary" }}>
              {fromLabel} — {toLabel}
            </Typography>
            <IconButton size="small" onClick={() => shiftWindow(1)} sx={{ bgcolor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <ChevronRightIcon />
            </IconButton>
          </Box>
          {!isAtToday && (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                size="small"
                onClick={() => { setWindowStart(todayStart); setSelectedDayIdx(0); }}
                sx={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "none", color: "primary.main", borderRadius: 2 }}
                startIcon={<CalendarTodayIcon sx={{ fontSize: 14 }} />}
              >
                Volver a hoy
              </Button>
            </Box>
          )}
        </Box>

        {/* Mobile: selector */}
        <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1, mb: 3 }}>
          {days.map((day, di) => {
            const dk = dateKey(day);
            const dow = (day.getDay() + 6) % 7;
            const isToday = dk === todayDk;
            const isSelected = di === selectedDayIdx;
            return (
              <Box
                key={di}
                onClick={() => setSelectedDayIdx(di)}
                sx={{
                  flex: 1, py: 1.5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", borderRadius: 3, cursor: "pointer",
                  bgcolor: isSelected ? "primary.main" : isToday ? "#eff6ff" : "#fff",
                  border: "2px solid",
                  borderColor: isSelected ? "primary.main" : isToday ? "primary.light" : "#e2e8f0",
                  boxShadow: isSelected ? "0 4px 12px rgba(37, 99, 235, 0.2)" : "none",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                }}
              >
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, color: isSelected ? "rgba(255,255,255,0.8)" : "text.secondary", textTransform: "uppercase", letterSpacing: 1 }}>
                  {DAY_ABBREVS[dow]}
                </Typography>
                <Typography sx={{ fontSize: "1.2rem", fontWeight: 800, color: isSelected ? "#fff" : isToday ? "primary.main" : "text.primary" }}>
                  {day.getDate()}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {isLoading && <PageLoader />}

        {!isLoading && data && data.courts.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>No hay canchas registradas.</Typography>
        )}

        {!isLoading && data && activeCourt && (
          <>
            {data.courts.length === 1 && (
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, color: COLORS.text }}>
                {activeCourt.name}
                {activeCourt.status === "NOT AVAILABLE" && (
                  <Chip label="No disponible" size="small" color="warning" sx={{ ml: 1.5, height: 20, fontSize: "0.65rem", fontWeight: 700 }} />
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
            {/* Legend */}
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 2, md: 3 }, mt: 2, flexWrap: "wrap", p: 2, bgcolor: "grey.50", borderRadius: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "3px", bgcolor: "#f0fdf4", border: "1px solid #dcfce7" }} />
                <Typography variant="caption" fontWeight={600} color="text.secondary">Libre</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "3px", bgcolor: "#fee2e2", border: "1px solid #fecaca" }} />
                <Typography variant="caption" fontWeight={600} color="text.secondary">Ocupado</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "3px", bgcolor: "#f1f5f9", border: "1px solid #e2e8f0" }} />
                <Typography variant="caption" fontWeight={600} color="text.secondary">Cerrado</Typography>
              </Box>
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
  const initials = profesor.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: COLORS.lightBorder,
        bgcolor: "#fff",
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
        width: "100%",
      }}
    >
      {/* Top accent */}
      <Box sx={{ height: 4, background: `linear-gradient(90deg, ${COLORS.accent} 0%, #f59e0b 100%)` }} />
      <Box sx={{ p: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: openDays.length > 0 ? 2 : 0 }}>
          <Avatar sx={{ width: 44, height: 44, bgcolor: COLORS.panelBg, color: COLORS.accent, fontWeight: 800, fontSize: "0.9rem", flexShrink: 0 }}>
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={800} sx={{ color: COLORS.text, lineHeight: 1.2, fontSize: "0.95rem" }} noWrap>
              {profesor.name}
            </Typography>
            {profesor.phone && (
              <Box
                component="a"
                href={waLink(profesor.phone)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25, color: "#16a34a", textDecoration: "none", "&:hover": { opacity: 0.8 } }}
              >
                <WhatsAppIcon sx={{ fontSize: 13 }} />
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700 }}>{profesor.phone}</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {openDays.length > 0 && (
          <Box sx={{ borderTop: "1px solid", borderColor: "#f1f5f9", pt: 1.5 }}>
            <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.muted, mb: 1 }}>
              Horarios
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.6 }}>
              {openDays.map(d => (
                <Box key={d.day} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: COLORS.text }}>{d.day.slice(0, 3)}</Typography>
                  <Typography sx={{ fontSize: "0.75rem", color: COLORS.muted }}>{d.openTime}–{d.closeTime}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
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
    <Box>
      {/* Search - only when multiple */}
      {!isLoading && profesores.length > 1 && (
        <Box sx={{ mb: 2.5 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar profesor..."
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
            sx={{
              maxWidth: { sm: 280 },
              "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#fff" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.lightBorder },
            }}
          />
        </Box>
      )}

      {isLoading && <PageLoader />}

      {!isLoading && filtered.length === 0 && (
        <Typography variant="body2" color="text.secondary">No se encontraron profesores.</Typography>
      )}

      {!isLoading && filtered.length > 0 && (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(240px, 1fr))" }, gap: 2 }}>
            {filtered.map(p => <ProfesorCard key={p.id} profesor={p} />)}
          </Box>
        </>
      )}
    </Box>
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

// ─── public page sidebar ──────────────────────────────────────────────────────

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
        width: 240,
        flexShrink: 0,
        bgcolor: COLORS.panelBg,
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        borderRight: `1px solid ${COLORS.border}`,
        boxShadow: "10px 0 30px rgba(0,0,0,0.1)"
      }}
    >
      <Box sx={{ px: 2, pt: 4, pb: 2, display: "flex", flexDirection: "column", gap: 1 }}>
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
                px: 2,
                py: 1.5,
                borderRadius: 3,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                bgcolor: active ? "rgba(255,255,255,0.1)" : "transparent",
                color: active ? COLORS.accent : "rgba(255,255,255,0.6)",
                fontWeight: 700,
                fontSize: "14px",
                transition: "all 0.2s",
                "&:hover": active ? {} : { bgcolor: "rgba(255,255,255,0.05)", color: "#fff" },
                position: "relative"
              }}
            >
              {active && (
                <Box sx={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 4, bgcolor: COLORS.accent, borderRadius: "0 4px 4px 0" }} />
              )}
              <Icon sx={{ fontSize: 20 }} />
              {label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── club info panel ─────────────────────────────────────────────────────────

interface ClubInfoPanelProps {
  clubName: string;
  address?: string;
  logoSrc?: string | null;
  mapUrl: string | null;
  businessHours: Array<{ day: string; isOpen?: boolean; openTime?: string; closeTime?: string }>;
  phone?: string | null;
}

function ClubInfoPanel({ clubName, address, logoSrc, mapUrl, businessHours, phone }: ClubInfoPanelProps) {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        width: 300,
        flexShrink: 0,
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        borderLeft: `1px solid ${COLORS.border}`,
        bgcolor: COLORS.panelBg,
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {/* Identity */}
      <Box sx={{ p: 3.5, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderBottom: `1px solid ${COLORS.border}` }}>
        <Box
          onClick={() => navigate("/")}
          sx={{ cursor: "pointer", mb: 2.5, transition: "transform 0.2s", "&:hover": { transform: "scale(1.05)" } }}
        >
          {logoSrc ? (
            <Box component="img" src={logoSrc} alt="logo" sx={{ width: 80, height: 80, borderRadius: 3, objectFit: "contain", border: `2px solid ${COLORS.border}`, bgcolor: "rgba(255,255,255,0.03)", p: 0.75 }} />
          ) : (
            <Box sx={{ width: 80, height: 80, borderRadius: 3, bgcolor: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SportsTennisIcon sx={{ fontSize: 40, color: COLORS.panelBg }} />
            </Box>
          )}
        </Box>
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#fff", lineHeight: 1.2, mb: address ? 0.75 : 0 }}>
          {clubName || "Club de Pádel"}
        </Typography>
        {address && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75, color: "rgba(255,255,255,0.45)", mt: 0.5 }}>
            <LocationOnIcon sx={{ fontSize: 13, mt: "3px", flexShrink: 0 }} />
            <Typography variant="caption" sx={{ lineHeight: 1.5, fontWeight: 500 }}>{address}</Typography>
          </Box>
        )}
      </Box>

      {/* Contact */}
      {phone && (
        <Box
          component="a"
          href={`https://wa.me/${phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("whatsapp_contacto")}
          sx={{ px: 3.5, py: 2, display: "flex", alignItems: "center", gap: 1.5, textDecoration: "none", borderBottom: `1px solid ${COLORS.border}`, transition: "bgcolor 0.15s", "&:hover": { bgcolor: "rgba(255,255,255,0.04)" } }}
        >
          <WhatsAppIcon sx={{ fontSize: 18, color: "#4ade80", flexShrink: 0 }} />
          <Typography variant="caption" fontWeight={600} sx={{ color: "#4ade80" }}>{phone}</Typography>
        </Box>
      )}

      {/* Hours */}
      {businessHours.some(h => h.isOpen) && (
        <Box sx={{ px: 3.5, py: 3, borderBottom: mapUrl ? `1px solid ${COLORS.border}` : "none" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
            <AccessTimeIcon sx={{ fontSize: 14, color: COLORS.accent }} />
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.4)" }}>
              Horarios
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {DAYS.map(day => {
              const sched = businessHours.find(h => h.day === day);
              if (!sched?.isOpen) return null;
              return (
                <Box key={day} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{day.slice(0, 3)}</Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>{sched.openTime}–{sched.closeTime}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Map */}
      {mapUrl && (
        <Box sx={{ p: 3, flex: 1 }}>
          <Box sx={{ borderRadius: 3, overflow: "hidden", height: 160, border: `1px solid ${COLORS.border}` }}>
            <Box component="iframe" src={mapUrl} title="Ubicación" sx={{ width: "100%", height: "100%", border: 0 }} loading="lazy" />
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─── mobile components ────────────────────────────────────────────────────────

function MobileBottomNav({ items, activeId, onSelect }: { items: PublicNavItem[]; activeId: string; onSelect: (id: string) => void }) {
  return (
    <Box
      component="nav"
      sx={{
        display: { xs: "flex", md: "none" },
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        zIndex: 1000,
        bgcolor: "rgba(15, 23, 42, 0.97)",
        backdropFilter: "blur(16px)",
        borderTop: `1px solid ${COLORS.border}`,
        pb: "env(safe-area-inset-bottom, 8px)",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.25)"
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
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 0.4, pt: 1.25, pb: 1, border: "none", bgcolor: "transparent", cursor: "pointer",
              color: active ? COLORS.accent : "rgba(255,255,255,0.35)", transition: "color 0.2s",
              position: "relative",
            }}
          >
            {active && (
              <Box sx={{ position: "absolute", top: 0, left: "25%", right: "25%", height: 2.5, bgcolor: COLORS.accent, borderRadius: "0 0 3px 3px" }} />
            )}
            <Icon sx={{ fontSize: 22 }} />
            <Typography sx={{ fontSize: "0.6rem", fontWeight: active ? 800 : 500, letterSpacing: 0.3, lineHeight: 1 }}>
              {label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ClubPublicPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();

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

  const activeSectionForSubRoute =
    subSection === "canchas"    ? "section-canchas" :
    subSection === "torneos"    ? "section-torneos" :
    subSection === "profesores" ? "section-profesores" : null;

  const [activeSection, setActiveSection] = useState(
    () => activeSectionForSubRoute ?? visibleNavItems[0]?.id ?? "section-torneos"
  );

  useEffect(() => {
    if (activeSectionForSubRoute) setActiveSection(activeSectionForSubRoute);
    else setActiveSection(visibleNavItems[0]?.id ?? "section-torneos");
  }, [activeSectionForSubRoute, visibleNavItems]);

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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", bgcolor: COLORS.panelBg }}>
        <Box sx={{ textAlign: "center", p: 4 }}>
          <SportsTennisIcon sx={{ fontSize: 64, color: COLORS.accent, mb: 2 }} />
          <Typography variant="h5" fontWeight={800} mb={1} sx={{ color: "#fff" }}>Club no encontrado</Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.5)" }}>No existe un club con ese nombre de usuario.</Typography>
          <Button onClick={() => navigate("/")} sx={{ mt: 3, color: COLORS.accent, fontWeight: 700 }}>Volver al inicio</Button>
        </Box>
      </Box>
    );
  }

  const mapUrl = profile.latitude && profile.longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${profile.longitude - 0.006}%2C${profile.latitude - 0.004}%2C${profile.longitude + 0.006}%2C${profile.latitude + 0.004}&layer=mapnik&marker=${profile.latitude}%2C${profile.longitude}`
    : null;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: COLORS.contentBg }}>

      <PublicPageSidebar items={visibleNavItems} activeId={activeSection} onSelect={handleNavSelect} />

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>


        <Box sx={{ flex: 1, px: { xs: 2, md: 5 }, py: { xs: 2.5, md: 5 }, pb: { xs: "calc(72px + env(safe-area-inset-bottom, 12px))", md: 5 }, maxWidth: 1100, mx: "auto", width: "100%" }}>

          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 4, md: 6 } }}>

            {/* Club info — mobile only */}
            {!subSection && (
              <Box id="section-club" sx={{ display: { xs: "block", md: "none" }, scrollMarginTop: "16px" }}>
                {/* Hero card */}
                <Box sx={{ borderRadius: 4, overflow: "hidden", background: `linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0f2744 100%)` }}>
                  {/* Identity */}
                  <Box sx={{ px: 3, pt: 4, pb: 3, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    {(profile.logoUrl || profile.logoBase64) ? (
                      <Box component="img" src={profile.logoUrl || profile.logoBase64 || undefined} alt="logo" sx={{ width: 80, height: 80, borderRadius: 3, objectFit: "contain", mb: 2.5, border: `2px solid rgba(255,255,255,0.12)`, bgcolor: "rgba(255,255,255,0.04)", p: 0.75 }} />
                    ) : (
                      <Box sx={{ width: 80, height: 80, borderRadius: 3, bgcolor: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", mb: 2.5 }}>
                        <SportsTennisIcon sx={{ fontSize: 40, color: COLORS.panelBg }} />
                      </Box>
                    )}
                    <Typography variant="h5" fontWeight={800} sx={{ color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", mb: 0.75 }}>
                      {profile.clubName}
                    </Typography>
                    {profile.address && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "rgba(255,255,255,0.5)" }}>
                        <LocationOnIcon sx={{ fontSize: 14, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ lineHeight: 1.4, fontWeight: 500 }}>{profile.address}</Typography>
                      </Box>
                    )}
                  </Box>

                  {/* WhatsApp CTA */}
                  {profile.phone && (
                    <Box sx={{ px: 3, pb: 3 }}>
                      <Box
                        component="a"
                        href={`https://wa.me/${profile.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent("whatsapp_contacto")}
                        sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5, py: 1.75, borderRadius: 3, bgcolor: "#16a34a", textDecoration: "none", transition: "opacity 0.15s", "&:hover": { opacity: 0.9 } }}
                      >
                        <WhatsAppIcon sx={{ fontSize: 22, color: "#fff" }} />
                        <Typography fontWeight={700} sx={{ color: "#fff", fontSize: "1rem" }}>Contactar por WhatsApp</Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Hours */}
                  {profile.businessHours.some(h => h.isOpen) && (
                    <Box sx={{ px: 3, py: 2.5, borderTop: `1px solid ${COLORS.border}` }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                        <AccessTimeIcon sx={{ fontSize: 14, color: COLORS.accent }} />
                        <Typography sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>Horarios</Typography>
                      </Box>
                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                        {DAYS.map(day => {
                          const sched = profile.businessHours.find(h => h.day === day);
                          if (!sched?.isOpen) return null;
                          return (
                            <Box key={day} sx={{ display: "flex", justifyContent: "space-between", gap: 1, py: 0.5, borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                              <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{day.slice(0, 3)}</Typography>
                              <Typography sx={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>{sched.openTime}–{sched.closeTime}</Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  )}

                  {/* Map */}
                  {mapUrl && (
                    <Box sx={{ height: 180 }}>
                      <Box component="iframe" src={mapUrl} title="Mapa" sx={{ width: "100%", height: "100%", border: 0, display: "block" }} loading="lazy" />
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {/* Torneos */}
            {(!subSection || subSection === "torneos") && (profile.showTournaments ?? true) && (
              <Box id="section-torneos" sx={{ scrollMarginTop: "16px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: { xs: 2.5, md: 3 } }}>
                  <Box sx={{ width: 4, height: 26, bgcolor: COLORS.accent, borderRadius: 2, flexShrink: 0 }} />
                  <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.02em", color: COLORS.text }}>Torneos</Typography>
                  {!tournamentsLoading && tournaments.length > 0 && (
                    <Chip label={tournaments.length} size="small" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700, bgcolor: "#f1f5f9", color: COLORS.muted }} />
                  )}
                </Box>

                {tournamentsLoading && <PageLoader />}
                {!tournamentsLoading && tournaments.length === 0 && (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <EmojiEventsIcon sx={{ fontSize: 44, color: "#cbd5e1", mb: 1.5 }} />
                    <Typography variant="body2" fontWeight={600} color="text.disabled">No hay torneos activos</Typography>
                  </Box>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2.5, md: 3 } }}>
                  {tournaments.map((t, idx) => (
                    <TournamentCard key={t.id} username={username!} tournament={t} index={idx} />
                  ))}
                </Box>
              </Box>
            )}

            {/* Canchas */}
            {(!subSection || subSection === "canchas") && (profile.showCourts ?? true) && (
              <Box id="section-canchas" sx={{ scrollMarginTop: "16px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: { xs: 2.5, md: 3 } }}>
                  <Box sx={{ width: 4, height: 26, bgcolor: COLORS.accent, borderRadius: 2, flexShrink: 0 }} />
                  <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.02em", color: COLORS.text }}>Canchas</Typography>
                </Box>
                <CourtsSection username={username!} businessHours={profile.businessHours} clubPhone={profile.phone} />
              </Box>
            )}

            {/* Profesores */}
            {(!subSection || subSection === "profesores") && (profile.showProfesores ?? true) && (
              <Box id="section-profesores" sx={{ scrollMarginTop: "16px" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: { xs: 2.5, md: 3 } }}>
                  <Box sx={{ width: 4, height: 26, bgcolor: COLORS.accent, borderRadius: 2, flexShrink: 0 }} />
                  <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.02em", color: COLORS.text }}>Profesores</Typography>
                </Box>
                <ProfesoresSection username={username!} />
              </Box>
            )}

          </Box>
        </Box>
      </Box>

      <ClubInfoPanel clubName={profile.clubName} address={profile.address} logoSrc={profile.logoUrl || profile.logoBase64} mapUrl={mapUrl} businessHours={profile.businessHours} phone={profile.phone} />
      <MobileBottomNav items={visibleNavItems} activeId={activeSection} onSelect={handleNavSelect} />

    </Box>
  );
}
