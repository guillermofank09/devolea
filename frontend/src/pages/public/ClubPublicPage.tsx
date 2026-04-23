import { useState, useMemo, Fragment, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import RoofingIcon from "@mui/icons-material/Roofing";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import SportsVolleyballIcon from "@mui/icons-material/SportsVolleyball";
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faThLarge, faTrophy, faChalkboardTeacher, faStore } from "@fortawesome/free-solid-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PersonIcon from "@mui/icons-material/Person";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SearchIcon from "@mui/icons-material/Search";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import WcOutlinedIcon from "@mui/icons-material/WcOutlined";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import ShowerOutlinedIcon from "@mui/icons-material/ShowerOutlined";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import OutdoorGrillOutlinedIcon from "@mui/icons-material/OutdoorGrillOutlined";
import DeckOutlinedIcon from "@mui/icons-material/DeckOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import type { TournamentMatch, Pair, TournamentDetail, TournamentTeam } from "../../types/Tournament";
import { isTeamSport } from "../tournaments/AddEditTournament";
import type { DaySchedule } from "../../types/ClubProfile";
import { fetchPublicProfile, fetchPublicTournaments, fetchPublicTournamentDetail, fetchPublicCourts, fetchPublicProfesores } from "../../api/publicService";
import type { PublicBookingSlot, PublicCourt, PublicProfesor, PaginatedTournaments } from "../../api/publicService";
import PageLoader from "../../components/common/PageLoader";
import GoogleMapView from "../../components/common/GoogleMapView";
import BracketView from "../tournaments/BracketView";
import { trackEvent } from "../../lib/analytics";
import { SPORT_LABEL } from "../../constants/sports";

// ─── constants ──────────────────────────────────────────────────────────────

const WINDOW_SIZE = 3;

const CATEGORY_LABEL: Record<string, string> = {
  PRIMERA: "1ra", SEGUNDA: "2da", TERCERA: "3ra", CUARTA: "4ta",
  QUINTA: "5ta", SEXTA: "6ta", SEPTIMA: "7ma", SIN_CATEGORIA: "S/C",
};

const FORMAT_LABEL: Record<string, string> = {
  ROUND_ROBIN: "Round Robin",
  BRACKET: "Llaves",
};

const SEX_LABEL: Record<string, string> = {
  MASCULINO: "Masculino",
  FEMENINO: "Femenino",
  MIXTO: "Mixto",
};

function getTournamentStatus(startDate: string, endDate: string): { label: string; color: "default" | "success" | "primary" | "info" } {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  if (now < start) return { label: "Diagramado", color: "default" };
  if (now > end)   return { label: "Finalizado",  color: "primary" };
  return               { label: "En Curso",    color: "success" };
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

const AMENITY_ICONS: Record<string, SvgIconComponent> = {
  Cantina:   RestaurantOutlinedIcon,
  Baños:     WcOutlinedIcon,
  Vestuario: CheckroomOutlinedIcon,
  Duchas:    ShowerOutlinedIcon,
  Wifi:      WifiOutlinedIcon,
  Parrillas: OutdoorGrillOutlinedIcon,
  Quinchos:  DeckOutlinedIcon,
};

function getNextOpenInfo(
  businessHours: Array<{ day: string; isOpen?: boolean; openTime?: string; closeTime?: string }>,
  todayName: string,
): string | null {
  const todayIdx = DAYS.indexOf(todayName);
  for (let i = 1; i <= 7; i++) {
    const day = DAYS[(todayIdx + i) % 7];
    const sched = businessHours.find(h => h.day === day);
    if (sched?.isOpen) {
      const label = i === 1 ? "Mañana" : day;
      return `Abre ${label} · ${sched.openTime}`;
    }
  }
  return null;
}

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

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(start)} → ${fmt(end)}`;
}

function formatDateShort(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function getTodayStatus(businessHours: Array<{ day: string; isOpen?: boolean; openTime?: string; closeTime?: string }>) {
  const jsDay = new Date().getDay();
  const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
  const todayName = DAYS[dayIndex];
  const sched = businessHours.find(h => h.day === todayName);
  if (!sched?.isOpen) return { open: false, hours: null, todayName };
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = parseHHMM(sched.openTime ?? "00:00");
  const closeMin = parseHHMM(sched.closeTime ?? "24:00");
  return { open: nowMin >= openMin && nowMin < closeMin, hours: `${sched.openTime}–${sched.closeTime}`, todayName };
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

function PublicTournamentCard({ tournament, onSelect }: { tournament: any; onSelect: (t: any) => void }) {
  const status = getTournamentStatus(tournament.startDate, tournament.endDate);
  const statusColor: Record<string, string> = { success: "#16a34a", primary: "#1d4ed8", default: "#64748b", info: "#0284c7" };
  const dotColor = statusColor[status.color] ?? "#64748b";

  // Mobile list row
  const mobileRow = (
    <Box
      onClick={() => onSelect(tournament)}
      sx={{
        display: { xs: "flex", sm: "none" },
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.5,
        cursor: "pointer",
        borderBottom: `1px solid ${COLORS.lightBorder}`,
        transition: "background 0.15s",
        "&:hover": { bgcolor: "#f8fafc" },
        "&:active": { bgcolor: "#f1f5f9" },
      }}
    >
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: dotColor, flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={700} noWrap sx={{ color: COLORS.text }}>
          {tournament.name}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.25 }}>
          <Chip label={`Cat. ${CATEGORY_LABEL[tournament.category] ?? tournament.category}`} size="small" color="info" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }} />
          {tournament.sex && <Chip label={SEX_LABEL[tournament.sex] ?? tournament.sex} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.6rem" }} />}
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
            {formatDateShort(tournament.startDate)}
          </Typography>
        </Box>
      </Box>
      <ChevronRightIcon sx={{ fontSize: 18, color: "text.disabled", flexShrink: 0 }} />
    </Box>
  );

  // Desktop card
  const desktopCard = (
    <Card
      elevation={0}
      sx={{
        display: { xs: "none", sm: "flex" },
        borderRadius: 2,
        height: "100%",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.2s",
        border: "1px solid",
        borderColor: "divider",
        "&:hover": { boxShadow: 4, transform: "translateY(-2px)" },
      }}
      onClick={() => onSelect(tournament)}
    >
      <CardContent sx={{ flex: 1 }}>
        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, mb: 1 }}>
          {tournament.name}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 1.5 }}>
          <Chip label={`Cat. ${CATEGORY_LABEL[tournament.category] ?? tournament.category}`} size="small" color="info" sx={{ fontWeight: 700, fontSize: "0.65rem", height: 20 }} />
          {tournament.sex && <Chip label={SEX_LABEL[tournament.sex] ?? tournament.sex} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.65rem", height: 20 }} />}
          <Chip label={status.label} size="small" color={status.color as any} sx={{ fontWeight: 600, fontSize: "0.65rem", height: 20 }} />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <CalendarTodayIcon sx={{ fontSize: 14 }} />
          {formatDateRange(tournament.startDate, tournament.endDate)}
        </Typography>
      </CardContent>
      <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
        <Button size="small" variant="outlined" fullWidth sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}>
          Ver fixture
        </Button>
      </CardActions>
    </Card>
  );

  return <>{mobileRow}{desktopCard}</>;
}

function TournamentDetailView({ username, tournament }: { username: string; tournament: any }) {
  const { data, isLoading } = useQuery<TournamentDetail>({
    queryKey: ["publicTournamentDetail", username, tournament.id],
    queryFn: () => fetchPublicTournamentDetail(username, tournament.id),
  });

  const teamMode = isTeamSport(data?.sport ?? tournament.sport ?? "");
  const hasMatches = (data?.matches.length ?? 0) > 0;
  const hasEntrants = teamMode ? (data?.teams?.length ?? 0) > 0 : (data?.pairs.length ?? 0) > 0;
  const unit = teamMode ? "equipos" : "parejas";

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        <Chip label={`Cat. ${CATEGORY_LABEL[tournament.category] ?? tournament.category}`} size="small" color="info" />
        {tournament.sex && <Chip label={SEX_LABEL[tournament.sex] ?? tournament.sex} size="small" variant="outlined" />}
        {tournament.format && <Chip label={FORMAT_LABEL[tournament.format] ?? tournament.format} size="small" variant="outlined" />}
      </Box>

      {isLoading && <PageLoader />}

      {!isLoading && data && !hasMatches && (
        <Box sx={{ textAlign: "center", py: 4 }}>
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
                      <Chip key={t.id} size="small" label={t.equipo.name} variant="outlined" sx={{ borderRadius: 2 }} />
                    ))
                  : data.pairs.map(p => (
                      <Chip key={p.id} size="small" label={p.player2 ? `${p.player1.name} / ${p.player2.name}` : p.player1.name} variant="outlined" sx={{ borderRadius: 2 }} />
                    ))
                }
              </Box>
            </Box>
          )}
        </Box>
      )}

      {!isLoading && data && hasMatches && (
        <Box sx={{ width: "100%", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {data.format === "BRACKET"
            ? <BracketView matches={data.matches} sex={data.sex} readOnly teamMode={teamMode} />
            : <RoundRobinList matches={data.matches} teamMode={teamMode} />
          }
        </Box>
      )}
    </Box>
  );
}

// ─── courts availability ─────────────────────────────────────────────────────

const SLOT_MIN = 60;
const DAY_ABBREVS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const STATUS_CONFIG: Record<string, { label: string; borderColor: string; chipColor: "success" | "error" | "default" }> = {
  AVAILABLE:       { label: "Disponible",    borderColor: "#4caf50", chipColor: "success" },
  "IN USE":        { label: "En Uso",        borderColor: "#f44336", chipColor: "error"   },
  "NOT AVAILABLE": { label: "No Disponible", borderColor: "#9e9e9e", chipColor: "default" },
};

const SPORT_CHIP: Record<string, { icon: React.ReactElement; bg: string; color: string }> = {
  PADEL:    { icon: <SportsTennisIcon />,    bg: "#fff8e1", color: "#c07700" },
  TENIS:    { icon: <SportsTennisIcon />,    bg: "#f1f8e9", color: "#2e7d32" },
  FUTBOL:   { icon: <SportsSoccerIcon />,    bg: "#e8f5e9", color: "#1b5e20" },
  FUTBOL5:  { icon: <SportsSoccerIcon />,    bg: "#e8f5e9", color: "#1b5e20" },
  FUTBOL7:  { icon: <SportsSoccerIcon />,    bg: "#e8f5e9", color: "#1b5e20" },
  FUTBOL9:  { icon: <SportsSoccerIcon />,    bg: "#e8f5e9", color: "#1b5e20" },
  FUTBOL11: { icon: <SportsSoccerIcon />,    bg: "#e8f5e9", color: "#1b5e20" },
  VOLEY:    { icon: <SportsVolleyballIcon />, bg: "#e3f2fd", color: "#0d47a1" },
  BASQUET:  { icon: <SportsBasketballIcon />, bg: "#fff3e0", color: "#bf360c" },
};

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

function PublicCourtCard({ court, onSelect }: { court: PublicCourt; onSelect: (c: any) => void }) {
  const { name, status, type, sport } = court;
  const { label, borderColor, chipColor } = STATUS_CONFIG[status] ?? STATUS_CONFIG["AVAILABLE"];
  const sportCfg = sport ? SPORT_CHIP[sport] : null;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1.5px solid",
        borderColor: "divider",
        borderLeft: `4px solid ${borderColor}`,
        transition: "all 0.2s",
        "&:hover": { boxShadow: "0 4px 14px rgba(0,0,0,0.10)", transform: "translateY(-2px)" },
        cursor: "pointer"
      }}
      onClick={() => onSelect(court)}
    >
      <CardContent sx={{ px: 2, pt: 1.75, pb: "14px !important" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ flex: 1 }}>
            {name}
          </Typography>
          <Chip
            label={label}
            color={chipColor as any}
            size="small"
            sx={{ fontWeight: 700, fontSize: "0.6rem", height: 18 }}
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary", gap: 0.5 }}>
            {type === "TECHADA" ? <RoofingIcon sx={{ fontSize: 13 }} /> : <WbSunnyIcon sx={{ fontSize: 13 }} />}
            <Typography variant="caption" sx={{ textTransform: "capitalize" }}>
              {type.toLowerCase()}
            </Typography>
          </Box>
          {sport && (
            <Chip
              icon={sportCfg?.icon}
              label={SPORT_LABEL[sport as keyof typeof SPORT_LABEL] ?? sport}
              size="small"
              sx={{
                height: 22,
                fontSize: "0.65rem",
                fontWeight: 700,
                bgcolor: sportCfg?.bg ?? "rgba(245,173,39,0.12)",
                color: sportCfg?.color ?? "#b07d00",
                "& .MuiChip-icon": { fontSize: 13, color: "inherit" },
              }}
            />
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1.25 }}>
          <CalendarMonthIcon sx={{ fontSize: 12, color: "text.disabled" }} />
          <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.65rem", fontWeight: 600, letterSpacing: 0.2 }}>
            Ver disponibilidad
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function CourtCalendar({
  court, bookings, businessHours, days, selectedDayIdx, clubPhone,
}: {
  court: PublicCourt;
  bookings: PublicBookingSlot[];
  businessHours: DaySchedule[];
  days: Date[];
  selectedDayIdx: number;
  clubPhone?: string | null;
}) {
  const daySchedules = days.map(d => {
    const dow = (d.getDay() + 6) % 7;
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
      {/* Legend + instruction */}
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#f0fdf4", border: "1px solid #d1fae5" }} /><Typography variant="caption">Libre</Typography></Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#fee2e2", border: "1px solid #fecaca" }} /><Typography variant="caption">Ocupado</Typography></Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }} /><Typography variant="caption">Cerrado</Typography></Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, ml: { md: "auto" } }}>
          <WhatsAppIcon sx={{ fontSize: 14, color: "#16a34a" }} />
          <Typography variant="caption" color="text.secondary">Tocá un horario libre para reservar por WhatsApp</Typography>
        </Box>
      </Box>
      {/* Desktop View */}
      <Box sx={{ display: { xs: "none", md: "block" }, overflowX: "auto", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: `60px repeat(${days.length}, 1fr)`, minWidth: 400 }}>
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
                      "&:hover": clickable ? { bgcolor: "#dcfce7" } : undefined,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    {occupied && <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 700, fontSize: "0.55rem", textTransform: "uppercase" }}>Ocupado</Typography>}
                  </Box>
                );
              })}
            </Fragment>
          ))}
        </Box>
      </Box>

      {/* Mobile View */}
      <Box sx={{ display: { xs: "block", md: "none" }, borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        {(() => {
          const day = days[selectedDayIdx];
          const dk  = dateKey(day);
          const { isClosed, openMin, closeMin } = daySchedules[selectedDayIdx];
          if (isClosed) {
            return <Box sx={{ py: 4, textAlign: "center", bgcolor: "#f8fafc" }}><Typography variant="body2" color="text.secondary">Cerrado este día.</Typography></Box>;
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
                      <Typography variant="caption" sx={{ fontSize: "0.75rem", fontWeight: 600, color: "text.secondary" }}>{`${String(Math.floor(slotMin / 60)).padStart(2, "0")}:00`}</Typography>
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
                        backgroundImage: outside ? "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.02) 4px, rgba(0,0,0,0.02) 8px)" : undefined,
                        borderBottom: "1px solid", borderColor: "divider",
                        display: "flex", alignItems: "center", px: 2, gap: 1.5,
                        cursor: clickable ? "pointer" : "default", textDecoration: "none",
                        "&:active": clickable ? { bgcolor: "#dcfce7" } : undefined,
                      }}
                    >
                      {occupied && <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#ef4444" }} />}
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

function CourtsSection({ username, businessHours, clubPhone }: { username: string; businessHours: DaySchedule[]; clubPhone?: string | null }) {
  const todayStart = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [windowStart, setWindowStart] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [selectedCourt, setSelectedCourt] = useState<PublicCourt | null>(null);
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const days = Array.from({ length: WINDOW_SIZE }, (_, i) => addDays(windowStart, i));
  const from = windowStart.toISOString();
  const to   = addDays(windowStart, WINDOW_SIZE).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ["publicCourts", username, dateKey(windowStart), page, sportFilter ?? ""],
    queryFn:  () => fetchPublicCourts(username, from, to, { page, sport: sportFilter ?? undefined }),
    enabled:  !!username,
    placeholderData: (prev) => prev,
  });

  const shiftWindow = (delta: number) => {
    setWindowStart(prev => addDays(prev, delta * WINDOW_SIZE));
    setSelectedDayIdx(0);
  };

  const handleSportFilter = (sport: string | null) => { setSportFilter(sport); setPage(1); };

  const todayDk    = dateKey(todayStart);
  const isAtToday  = dateKey(windowStart) === todayDk;
  const fromLabel  = days[0].toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  const toLabel    = days[WINDOW_SIZE - 1].toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });

  const isMobile = useMediaQuery("(max-width:600px)");
  const availableSports = data?.availableSports ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (isLoading && !data) return <PageLoader />;

  return (
    <>
      {availableSports.length > 1 && (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          <Chip
            label="Todos"
            onClick={() => handleSportFilter(null)}
            variant={sportFilter === null ? "filled" : "outlined"}
            size="small"
            sx={sportFilter === null
              ? { bgcolor: COLORS.accent, color: "#111", fontWeight: 700, "& .MuiChip-label": { px: 1.5 } }
              : { fontWeight: 600 }}
          />
          {availableSports.map(sport => (
            <Chip
              key={sport}
              label={SPORT_LABEL[sport as keyof typeof SPORT_LABEL] ?? sport}
              onClick={() => handleSportFilter(sport)}
              variant={sportFilter === sport ? "filled" : "outlined"}
              size="small"
              sx={sportFilter === sport
                ? { bgcolor: COLORS.accent, color: "#111", fontWeight: 700, "& .MuiChip-label": { px: 1.5 } }
                : { fontWeight: 600 }}
            />
          ))}
        </Box>
      )}
      <Grid container spacing={2}>
        {(data?.courts ?? []).map(court => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={court.id}>
            <PublicCourtCard court={court} onSelect={setSelectedCourt} />
          </Grid>
        ))}
        {(data?.courts ?? []).length === 0 && (
          <Grid size={12}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>No hay canchas registradas.</Typography>
          </Grid>
        )}
      </Grid>
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" />
        </Box>
      )}

      <Dialog
        open={!!selectedCourt}
        onClose={() => setSelectedCourt(null)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3 } } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>{selectedCourt?.name}</Typography>
            {selectedCourt && (
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                {selectedCourt.sport?.toLowerCase()} · {selectedCourt.type?.toLowerCase()}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "grey.50", p: 0.5, borderRadius: 2, mr: 1 }}>
              <IconButton size="small" onClick={() => shiftWindow(-1)} disabled={isAtToday}><ChevronLeftIcon /></IconButton>
              <Typography variant="caption" fontWeight={800}>{fromLabel} — {toLabel}</Typography>
              <IconButton size="small" onClick={() => shiftWindow(1)}><ChevronRightIcon /></IconButton>
            </Box>
            <IconButton size="small" onClick={() => setSelectedCourt(null)}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {/* Mobile day selector */}
          <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1, mb: 3 }}>
            {days.map((day, di) => (
              <Box
                key={di}
                onClick={() => setSelectedDayIdx(di)}
                sx={{
                  flex: 1, py: 1.5, display: "flex", flexDirection: "column", alignItems: "center", borderRadius: 2, cursor: "pointer",
                  bgcolor: di === selectedDayIdx ? "primary.main" : "grey.100",
                  color: di === selectedDayIdx ? "#fff" : "text.primary",
                  transition: "all 0.2s"
                }}
              >
                <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase" }}>{DAY_ABBREVS[(day.getDay() + 6) % 7]}</Typography>
                <Typography sx={{ fontSize: "1.1rem", fontWeight: 800 }}>{day.getDate()}</Typography>
              </Box>
            ))}
          </Box>

          {selectedCourt && (
            <CourtCalendar
              court={selectedCourt}
              bookings={data?.bookings || []}
              businessHours={businessHours}
              days={days}
              selectedDayIdx={selectedDayIdx}
              clubPhone={clubPhone}
            />
          )}

        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── profesores ───────────────────────────────────────────────────────────────

function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const SEX_LABEL_P: Record<string, string> = { MASCULINO: "Masculino", FEMENINO: "Femenino" };

function ProfesorRow({ profesor, onClick }: { profesor: PublicProfesor; onClick: () => void }) {
  const openDays = (profesor.schedule ?? []).filter(d => d.isOpen);
  const daysSummary = openDays.map(d => d.day.slice(0, 3)).join(" · ");

  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        width: "100%", display: "flex", alignItems: "center", gap: 2,
        px: 2, py: 1.5, border: "none", bgcolor: "transparent", cursor: "pointer",
        textAlign: "left", borderRadius: 0,
        transition: "background 0.15s",
        "&:hover": { bgcolor: "rgba(245,173,39,0.06)" },
      }}
    >
      <Avatar
        src={profesor.avatarUrl ?? undefined}
        sx={{ width: 44, height: 44, bgcolor: COLORS.panelBg, color: COLORS.accent, fontWeight: 800, fontSize: "0.9rem", flexShrink: 0 }}
      >
        {!profesor.avatarUrl && initials(profesor.name)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography fontWeight={700} sx={{ color: COLORS.text, fontSize: "0.95rem", lineHeight: 1.3 }}>
            {profesor.name}
          </Typography>
          {profesor.sport && (
            <Chip
              label={SPORT_LABEL[profesor.sport as keyof typeof SPORT_LABEL] ?? profesor.sport}
              size="small"
              sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, bgcolor: "rgba(245,173,39,0.12)", color: "#b07d00" }}
            />
          )}
        </Box>
        {daysSummary ? (
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.muted, mt: 0.25 }}>{daysSummary}</Typography>
        ) : (
          <Typography sx={{ fontSize: "0.75rem", color: COLORS.muted, mt: 0.25, fontStyle: "italic" }}>Sin horarios cargados</Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
        {profesor.phone && <WhatsAppIcon sx={{ fontSize: 16, color: "#16a34a" }} />}
        <ChevronRightIcon sx={{ fontSize: 18, color: "text.disabled" }} />
      </Box>
    </Box>
  );
}

function ProfesorDetailDialog({ profesor, open, onClose }: { profesor: PublicProfesor | null; open: boolean; onClose: () => void }) {
  const isMobile = useMediaQuery("(max-width:600px)");
  const openDays = (profesor?.schedule ?? []).filter(d => d.isOpen);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3 } } }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Typography fontWeight={800}>Perfil del profesor</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {profesor && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            {/* Avatar */}
            <Avatar
              src={profesor.avatarUrl ?? undefined}
              sx={{ width: 88, height: 88, bgcolor: COLORS.panelBg, color: COLORS.accent, fontWeight: 800, fontSize: "1.8rem", mt: 1 }}
            >
              {!profesor.avatarUrl && initials(profesor.name)}
            </Avatar>

            {/* Name + tags */}
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, color: COLORS.text }}>{profesor.name}</Typography>
              <Box sx={{ display: "flex", gap: 0.75, justifyContent: "center", flexWrap: "wrap", mt: 0.75 }}>
                {profesor.sport && (
                  <Chip
                    label={SPORT_LABEL[profesor.sport as keyof typeof SPORT_LABEL] ?? profesor.sport}
                    size="small"
                    sx={{ fontWeight: 700, bgcolor: "rgba(245,173,39,0.12)", color: "#b07d00" }}
                  />
                )}
                {profesor.sex && (
                  <Chip label={SEX_LABEL_P[profesor.sex] ?? profesor.sex} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                )}
              </Box>
            </Box>

            {/* Contact */}
            {profesor.phone && (
              <Box
                component="a"
                href={waLink(profesor.phone)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5,
                  py: 1.5, borderRadius: 2.5, bgcolor: "#16a34a", textDecoration: "none",
                  transition: "opacity 0.15s", "&:hover": { opacity: 0.88 },
                }}
              >
                <WhatsAppIcon sx={{ fontSize: 20, color: "#fff" }} />
                <Typography fontWeight={700} sx={{ color: "#fff", fontSize: "0.95rem" }}>Contactar por WhatsApp</Typography>
              </Box>
            )}

            {/* Schedule */}
            {openDays.length > 0 && (
              <Box sx={{ width: "100%", borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
                <Typography sx={{ fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: COLORS.muted, mb: 1.5 }}>
                  Horarios de clases
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {openDays.map((d, i) => (
                    <Box
                      key={d.day}
                      sx={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        px: 1.5, py: 1,
                        bgcolor: i % 2 === 0 ? "#f8fafc" : "#fff",
                        borderRadius: i === 0 ? "8px 8px 0 0" : i === openDays.length - 1 ? "0 0 8px 8px" : 0,
                      }}
                    >
                      <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: COLORS.text }}>{d.day}</Typography>
                      <Typography sx={{ fontSize: "0.85rem", color: COLORS.muted }}>{d.openTime} – {d.closeTime}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {openDays.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 1 }}>
                Sin horarios cargados.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProfesoresSection({ username }: { username: string }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProfesor, setSelectedProfesor] = useState<PublicProfesor | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["publicProfesores", username, page, debouncedSearch],
    queryFn: () => fetchPublicProfesores(username, { page, search: debouncedSearch || undefined }),
    enabled: !!username,
    placeholderData: (prev) => prev,
  });

  const profesores = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  if (!isLoading && total === 0 && !debouncedSearch) return null;

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "flex-start", md: "center" }, gap: { xs: 1.5, md: 2 }, mb: { xs: 2.5, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 4, height: 26, bgcolor: COLORS.accent, borderRadius: 2, flexShrink: 0 }} />
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.02em", color: COLORS.text }}>Profesores</Typography>
          {!isLoading && total > 0 && (
            <Chip label={total} size="small" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700, bgcolor: "#f1f5f9", color: COLORS.muted }} />
          )}
        </Box>
        {!isLoading && (total > 1 || search !== "") && (
          <TextField
            size="small"
            placeholder="Buscar profesor..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearch(""); setPage(1); }}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              ml: { md: "auto" },
              width: { xs: "100%", md: 220 },
              "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#fff" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.lightBorder },
            }}
          />
        )}
      </Box>

      {isLoading && <PageLoader />}

      {!isLoading && profesores.length === 0 && (
        <Typography variant="body2" color="text.secondary">No se encontraron profesores.</Typography>
      )}

      {!isLoading && profesores.length > 0 && (
        <Paper elevation={0} sx={{ border: "1px solid", borderColor: COLORS.lightBorder, borderRadius: 3, overflow: "hidden" }}>
          {profesores.map((p, i) => (
            <Box key={p.id}>
              {i > 0 && <Divider />}
              <ProfesorRow profesor={p} onClick={() => setSelectedProfesor(p)} />
            </Box>
          ))}
        </Paper>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} size="small" />
        </Box>
      )}

      <ProfesorDetailDialog
        profesor={selectedProfesor}
        open={!!selectedProfesor}
        onClose={() => setSelectedProfesor(null)}
      />
    </Box>
  );
}


// ─── navigation items ─────────────────────────────────────────────────────────

interface PublicNavItem {
  id: string;
  label: string;
  icon: IconProp;
}

const ALL_NAV_ITEMS: PublicNavItem[] = [
  { id: "section-club",       label: "Club",       icon: faStore            },
  { id: "section-torneos",    label: "Torneos",    icon: faTrophy           },
  { id: "section-canchas",    label: "Canchas",    icon: faThLarge          },
  { id: "section-profesores", label: "Profesores", icon: faChalkboardTeacher },
];

// ─── public page sidebar ──────────────────────────────────────────────────────

interface PublicSidebarProps {
  items: PublicNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  clubName?: string;
  username?: string;
  logoSrc?: string | null;
}

function PublicPageSidebar({ items, activeId, onSelect }: PublicSidebarProps) {
  const desktopItems = items.filter(item => item.id !== "section-club");

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        bgcolor: "#111111",
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Box sx={{ flex: 1, px: "12px", pt: "12px", pb: "12px", display: "flex", flexDirection: "column", gap: "3px" }}>
        {desktopItems.map(({ id, label, icon }) => {
          const active = activeId === id;
          return (
            <Box
              key={id}
              component="button"
              onClick={() => onSelect(id)}
              sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                px: "14px",
                py: "11px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                bgcolor: "transparent",
                color: active ? COLORS.accent : "#6b7a99",
                fontWeight: active ? 700 : 500,
                fontSize: "14px",
                letterSpacing: "0.1px",
                transition: "background 150ms ease, color 150ms ease",
                "&:hover": active
                  ? { bgcolor: "rgba(255,255,255,0.05)" }
                  : { bgcolor: "rgba(255,255,255,0.05)", color: "#e8eaf0" },
                "&:active": { transform: "scale(0.98)" },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  borderRadius: "9px",
                  fontSize: "18px",
                  bgcolor: active ? "rgba(245,173,39,0.12)" : "rgba(255,255,255,0.04)",
                  color: active ? COLORS.accent : "inherit",
                  transition: "background 150ms ease, color 150ms ease",
                }}
              >
                <FontAwesomeIcon icon={icon} />
              </Box>
              {label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── mobile top bar ──────────────────────────────────────────────────────────

function MobileTopBar({ clubName, username, logoSrc, phone }: { clubName?: string; username?: string; logoSrc?: string | null; phone?: string | null }) {
  return (
    <Box
      sx={{
        display: { xs: "flex", md: "none" },
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 1100,
        height: 56,
        bgcolor: COLORS.panelBg,
        borderBottom: `1px solid ${COLORS.border}`,
        backdropFilter: "blur(16px)",
        alignItems: "center",
        px: 2,
        gap: 1.5,
      }}
    >
      {logoSrc ? (
        <Box component="img" src={logoSrc} alt="logo" sx={{ width: 32, height: 32, borderRadius: "50%", objectFit: "contain", bgcolor: "#111111", border: `1.5px solid rgba(255,255,255,0.15)`, p: "3px", flexShrink: 0 }} />
      ) : (
        <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <PersonIcon sx={{ fontSize: 18, color: COLORS.panelBg }} />
        </Box>
      )}
      <Typography variant="subtitle2" fontWeight={800} noWrap sx={{ color: "#fff", flex: 1, letterSpacing: "-0.01em" }}>
        {clubName || username || "Club"}
      </Typography>
      {phone && (
        <Box
          component="a"
          href={`https://wa.me/${phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("whatsapp_contacto")}
          sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 2, bgcolor: "#16a34a", color: "#fff", flexShrink: 0, textDecoration: "none" }}
        >
          <WhatsAppIcon sx={{ fontSize: 20 }} />
        </Box>
      )}
    </Box>
  );
}

// ─── club info panel ─────────────────────────────────────────────────────────

interface ClubInfoPanelProps {
  clubName: string;
  username: string;
  address?: string;
  logoSrc?: string | null;
  lat?: number | null;
  lng?: number | null;
  businessHours: Array<{ day: string; isOpen?: boolean; openTime?: string; closeTime?: string }>;
  phone?: string | null;
  amenities?: string[];
}

function ClubInfoPanel({ clubName, username, address, logoSrc, lat, lng, businessHours, phone, amenities }: ClubInfoPanelProps) {
  const navigate = useNavigate();
  const todayStatus = getTodayStatus(businessHours);
  const nextOpenInfo = !todayStatus.open ? getNextOpenInfo(businessHours, todayStatus.todayName) : null;
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
      <Box sx={{ p: 3.5, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", borderBottom: `1px solid ${COLORS.border}` }}>
        <Box
          onClick={() => navigate("/")}
          sx={{ cursor: "pointer", mb: 2.5, transition: "transform 0.2s", "&:hover": { transform: "scale(1.05)" } }}
        >
          {logoSrc ? (
            <Box component="img" src={logoSrc} alt="logo" sx={{ width: 80, height: 80, borderRadius: "50%", objectFit: "contain", border: `2px solid rgba(255,255,255,0.15)`, bgcolor: "#111111", p: "8px" }} />
          ) : (
            <Box sx={{ width: 80, height: 80, borderRadius: "50%", bgcolor: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PersonIcon sx={{ fontSize: 44, color: COLORS.panelBg }} />
            </Box>
          )}
        </Box>
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#fff", lineHeight: 1.2, mb: address ? 0.75 : 0 }}>
          {clubName || username}
        </Typography>
        {address && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75, color: "rgba(255,255,255,0.45)", mt: 0.5 }}>
            <LocationOnIcon sx={{ fontSize: 13, mt: "3px", flexShrink: 0 }} />
            <Typography variant="caption" sx={{ lineHeight: 1.5, fontWeight: 500 }}>{address}</Typography>
          </Box>
        )}
      </Box>

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

      {/* Open/closed status */}
      <Box sx={{ px: 3.5, py: 2, borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          bgcolor: todayStatus.open ? "#4ade80" : "#f87171",
          boxShadow: todayStatus.open ? "0 0 0 3px rgba(74,222,128,0.2)" : "0 0 0 3px rgba(248,113,113,0.2)",
        }} />
        <Box>
          <Typography variant="caption" fontWeight={700} sx={{ color: todayStatus.open ? "#4ade80" : "#f87171", display: "block", lineHeight: 1.3 }}>
            {todayStatus.open ? "Abierto ahora" : "Cerrado ahora"}
            {todayStatus.open && todayStatus.hours && (
              <Typography component="span" variant="caption" sx={{ color: "rgba(255,255,255,0.35)", fontWeight: 400, ml: 0.75 }}>
                · cierra {todayStatus.hours?.split("–")[1]}
              </Typography>
            )}
          </Typography>
          {!todayStatus.open && nextOpenInfo && (
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
              {nextOpenInfo}
            </Typography>
          )}
        </Box>
      </Box>

      {amenities && amenities.length > 0 && (
        <Box sx={{ px: 3.5, py: 2.5, borderBottom: `1px solid ${COLORS.border}` }}>
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.4)", display: "block", mb: 1.5 }}>
            Servicios
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {amenities.map(a => {
              const Icon = AMENITY_ICONS[a];
              return (
                <Box key={a} sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.5, borderRadius: 10, border: `1px solid rgba(255,255,255,0.15)`, bgcolor: "rgba(255,255,255,0.07)" }}>
                  {Icon && <Icon sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }} />}
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 500, fontSize: "0.7rem" }}>{a}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      <Box sx={{ px: 3.5, py: 3, borderBottom: (lat && lng && address) ? `1px solid ${COLORS.border}` : "none" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
          <AccessTimeIcon sx={{ fontSize: 14, color: COLORS.accent }} />
          <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(255,255,255,0.4)" }}>
            Horarios
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {DAYS.map(day => {
            const sched = businessHours.find(h => h.day === day);
            const open = sched?.isOpen ?? false;
            const isToday = day === todayStatus.todayName;
            return (
              <Box key={day} sx={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                px: 1, py: 0.75, mx: -1, borderRadius: 1.5,
                bgcolor: isToday ? (todayStatus.open ? "rgba(74,222,128,0.08)" : "rgba(248,113,113,0.06)") : "transparent",
              }}>
                <Typography variant="caption" sx={{
                  fontWeight: isToday ? 800 : 600,
                  color: isToday ? (todayStatus.open ? "#4ade80" : "#f87171") : (open ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.25)"),
                }}>
                  {day.slice(0, 3)}{isToday && <Typography component="span" variant="caption" sx={{ ml: 0.5, fontSize: "0.6rem", opacity: 0.7 }}>· hoy</Typography>}
                </Typography>
                <Typography variant="caption" sx={{
                  color: isToday ? (todayStatus.open ? "rgba(74,222,128,0.7)" : "rgba(248,113,113,0.6)") : (open ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"),
                  fontWeight: isToday ? 700 : 500,
                }}>
                  {open ? `${sched!.openTime}–${sched!.closeTime}` : "Cerrado"}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {lat && lng && address && (
        <Box sx={{ p: 3, flex: 1 }}>
          <Box sx={{ borderRadius: 3, overflow: "hidden", height: 160, border: `1px solid ${COLORS.border}` }}>
            <GoogleMapView lat={lat} lng={lng} height={160} interactive />
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
      {items.map(({ id, label, icon }) => {
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
            <FontAwesomeIcon icon={icon} style={{ fontSize: 20 }} />
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

  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);
  const [tournamentSportFilter, setTournamentSportFilter] = useState<string | null>(null);
  const [tournamentSearch, setTournamentSearch] = useState("");
  const [tournamentDebouncedSearch, setTournamentDebouncedSearch] = useState("");
  const [tournamentPage, setTournamentPage] = useState(1);
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    const t = setTimeout(() => setTournamentDebouncedSearch(tournamentSearch), 300);
    return () => clearTimeout(t);
  }, [tournamentSearch]);

  const { data: profile, isLoading: profileLoading, isError: profileError } = useQuery({
    queryKey: ["publicProfile", username],
    queryFn: () => fetchPublicProfile(username!),
    enabled: !!username,
    retry: false,
  });

  const { data: tournamentsData, isLoading: tournamentsLoading } = useQuery<PaginatedTournaments>({
    queryKey: ["publicTournaments", username, tournamentPage, tournamentDebouncedSearch, tournamentSportFilter ?? ""],
    queryFn: () => fetchPublicTournaments(username!, {
      page: tournamentPage,
      search: tournamentDebouncedSearch || undefined,
      sport: tournamentSportFilter ?? undefined,
    }),
    enabled: !!username,
    placeholderData: (prev) => prev,
  });

  const tournaments      = tournamentsData?.data           ?? [];
  const tournamentsTotal = tournamentsData?.total          ?? 0;
  const tournamentPages  = tournamentsData?.totalPages     ?? 1;
  const tournamentSports = tournamentsData?.availableSports ?? [];

  const handleTournamentSportFilter = (sport: string | null) => { setTournamentSportFilter(sport); setTournamentPage(1); };

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
    setSelectedTournament(null);
    if (isMobile) {
      // Mobile always URL-based (each tab = its own view)
      if (id === "section-torneos")         navigate(`/${username}/torneos`);
      else if (id === "section-canchas")    navigate(`/${username}/canchas`);
      else if (id === "section-profesores") navigate(`/${username}/profesores`);
      else                                  navigate(`/${username}`);
    } else if (subSection) {
      if (id === "section-torneos")         navigate(`/${username}/torneos`);
      else if (id === "section-canchas")    navigate(`/${username}/canchas`);
      else if (id === "section-profesores") navigate(`/${username}/profesores`);
      else                                  navigate(`/${username}`);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // On mobile: only show the active section (no scroll-through-all)
  const showSection = (id: "torneos" | "canchas" | "profesores") =>
    subSection ? subSection === id : !isMobile;

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


  const todayStatus = getTodayStatus(profile.businessHours);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: COLORS.contentBg }}>

      <MobileTopBar clubName={profile.clubName} username={username} logoSrc={profile.logoUrl || profile.logoBase64} phone={profile.phone} />

      <PublicPageSidebar items={visibleNavItems} activeId={activeSection} onSelect={handleNavSelect} clubName={profile.clubName} username={username} logoSrc={profile.logoUrl || profile.logoBase64} />

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        <Box sx={{ flex: 1, pt: { xs: "56px", md: 0 }, px: { xs: 0, md: 5 }, py: { xs: 0, md: 5 }, pb: { xs: "calc(72px + env(safe-area-inset-bottom, 12px))", md: 5 }, maxWidth: { md: 1100 }, mx: "auto", width: "100%" }}>

          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 0, md: 6 } }}>

            {/* Club info — mobile tab */}
            {(!subSection || subSection === null) && (
              <Box id="section-club" sx={{ display: { xs: "block", md: "none" }, pb: 2 }}>

                {/* Courts by sport */}
                {profile.courtsBySport && Object.keys(profile.courtsBySport).length > 0 && (
                  <Box sx={{ mx: 2, mt: 2, mb: 1.5 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {Object.entries(profile.courtsBySport).map(([sport, names]) => (
                        <Box key={sport} sx={{ p: 2, borderRadius: 3, border: `1px solid ${COLORS.lightBorder}`, bgcolor: "#fff" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            <Box sx={{ width: 3, height: 16, borderRadius: 2, bgcolor: COLORS.accent, flexShrink: 0 }} />
                            <Typography variant="caption" fontWeight={800} sx={{ textTransform: "uppercase", letterSpacing: "0.07em", color: COLORS.text }}>
                              {SPORT_LABEL[sport as keyof typeof SPORT_LABEL] ?? sport}
                            </Typography>
                            <Typography variant="caption" sx={{ color: COLORS.muted, ml: "auto" }}>
                              {names.length} {names.length === 1 ? "cancha" : "canchas"}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                            {names.map(name => (
                              <Chip key={name} label={name} size="small" sx={{ height: 22, fontSize: "0.72rem", fontWeight: 600, bgcolor: "#f1f5f9", color: COLORS.text, border: `1px solid ${COLORS.lightBorder}` }} />
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Today status banner */}
                <Box sx={{ px: 2, pt: profile.courtsBySport && Object.keys(profile.courtsBySport).length > 0 ? 0 : 2, pb: 1.5 }}>
                  <Box sx={{
                    display: "flex", alignItems: "center", gap: 1.5,
                    px: 2, py: 1.5, borderRadius: 3,
                    bgcolor: todayStatus.open ? "#f0fdf4" : "#fef2f2",
                    border: `1px solid ${todayStatus.open ? "#bbf7d0" : "#fecaca"}`,
                  }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: todayStatus.open ? "#16a34a" : "#dc2626", flexShrink: 0 }} />
                    <Box>
                      <Typography variant="body2" fontWeight={800} sx={{ color: todayStatus.open ? "#15803d" : "#dc2626", lineHeight: 1.1 }}>
                        {todayStatus.open ? "Abierto ahora" : "Cerrado ahora"}
                      </Typography>
                      {todayStatus.hours && (
                        <Typography variant="caption" sx={{ color: todayStatus.open ? "#166534" : "#b91c1c", fontWeight: 500 }}>
                          {todayStatus.todayName} · {todayStatus.hours}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Amenities */}
                {profile.amenities && profile.amenities.length > 0 && (
                  <Box sx={{ mx: 2, mb: 1.5, borderRadius: 3, border: `1px solid ${COLORS.lightBorder}`, overflow: "hidden", bgcolor: "#fff" }}>
                    <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${COLORS.lightBorder}`, display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="caption" fontWeight={800} sx={{ textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.muted }}>Servicios</Typography>
                      <Typography variant="caption" sx={{ color: COLORS.muted, ml: "auto", fontWeight: 600 }}>{profile.amenities.length}</Typography>
                    </Box>
                    <Box sx={{ px: 2, py: 1.5, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      {profile.amenities.map(a => {
                        const Icon = AMENITY_ICONS[a];
                        return (
                          <Box key={a} sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.5, borderRadius: 10, border: `1px solid ${COLORS.lightBorder}`, bgcolor: "#f8fafc" }}>
                            {Icon && <Icon sx={{ fontSize: "0.8rem", color: COLORS.accent }} />}
                            <Typography variant="caption" sx={{ color: COLORS.muted, fontWeight: 600, fontSize: "0.72rem" }}>{a}</Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {/* Full schedule */}
                <Box sx={{ mx: 2, mb: 1.5, borderRadius: 3, border: `1px solid ${COLORS.lightBorder}`, overflow: "hidden", bgcolor: "#fff" }}>
                  <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${COLORS.lightBorder}`, display: "flex", alignItems: "center", gap: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: 14, color: COLORS.accent }} />
                    <Typography variant="caption" fontWeight={800} sx={{ textTransform: "uppercase", letterSpacing: "0.08em", color: COLORS.muted }}>Horarios</Typography>
                  </Box>
                  {DAYS.map((day, i) => {
                    const sched = profile.businessHours.find(h => h.day === day);
                    const open = sched?.isOpen ?? false;
                    const isToday = day === todayStatus.todayName;
                    return (
                      <Box key={day} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 1, borderBottom: i < DAYS.length - 1 ? `1px solid ${COLORS.lightBorder}` : "none", bgcolor: isToday ? (open ? "rgba(22,163,74,0.05)" : "rgba(220,38,38,0.03)") : "transparent" }}>
                        <Typography variant="body2" fontWeight={isToday ? 800 : 600} sx={{ color: open ? COLORS.text : "#94a3b8" }}>
                          {day}{isToday && <Typography component="span" variant="caption" sx={{ ml: 0.75, color: todayStatus.open ? "#16a34a" : "#dc2626", fontWeight: 700 }}>· hoy</Typography>}
                        </Typography>
                        <Typography variant="body2" sx={{ color: open ? COLORS.muted : "#cbd5e1", fontWeight: open ? 500 : 400 }}>
                          {open ? `${sched!.openTime}–${sched!.closeTime}` : "Cerrado"}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                {/* Map + address */}
                {profile.latitude && profile.longitude && profile.address && (
                  <Box sx={{ mx: 2 }}>
                    <Box sx={{ borderRadius: 3, overflow: "hidden", height: 200, border: `1px solid ${COLORS.lightBorder}`, mb: 1 }}>
                      <GoogleMapView lat={profile.latitude} lng={profile.longitude} height={200} interactive />
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                      <LocationOnIcon sx={{ fontSize: 15, color: COLORS.muted, mt: "2px", flexShrink: 0 }} />
                      <Typography variant="caption" sx={{ color: COLORS.muted, lineHeight: 1.5 }}>{profile.address}</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Torneos */}
            {showSection("torneos") && (profile.showTournaments ?? true) && (
              <Box id="section-torneos" sx={{ scrollMarginTop: "16px" }}>
                {/* Section header */}
                <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { xs: "flex-start", md: "center" }, gap: { xs: 1.5, md: 2 }, mb: { xs: 2, md: 3 }, px: { xs: 2, md: 0 }, pt: { xs: 2, md: 0 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 4, height: 26, bgcolor: COLORS.accent, borderRadius: 2, flexShrink: 0 }} />
                    <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.02em", color: COLORS.text }}>Torneos</Typography>
                    {!tournamentsLoading && tournamentsTotal > 0 && (
                      <Chip label={tournamentsTotal} size="small" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700, bgcolor: "#f1f5f9", color: COLORS.muted }} />
                    )}
                  </Box>
                  {!tournamentsLoading && (tournamentsTotal > 1 || tournamentSearch !== "") && (
                    <TextField
                      size="small"
                      placeholder="Buscar torneo..."
                      value={tournamentSearch}
                      onChange={e => { setTournamentSearch(e.target.value); setTournamentPage(1); }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                            </InputAdornment>
                          ),
                          endAdornment: tournamentSearch ? (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => { setTournamentSearch(""); setTournamentPage(1); }}>
                                <CloseIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </InputAdornment>
                          ) : null,
                        },
                      }}
                      sx={{
                        ml: { md: "auto" },
                        width: { xs: "100%", md: 220 },
                        "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#fff" },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: COLORS.lightBorder },
                      }}
                    />
                  )}
                </Box>

                {tournamentsLoading && <PageLoader />}

                {!tournamentsLoading && tournaments.length === 0 && (
                  <Box sx={{ py: 8, textAlign: "center" }}>
                    <EmojiEventsIcon sx={{ fontSize: 44, color: "#cbd5e1", mb: 1.5 }} />
                    <Typography variant="body2" fontWeight={600} color="text.disabled">No hay torneos activos</Typography>
                  </Box>
                )}

                {!tournamentsLoading && tournamentSports.length > 1 && (
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2, px: { xs: 2, md: 0 } }}>
                    <Chip label="Todos" onClick={() => handleTournamentSportFilter(null)} variant={tournamentSportFilter === null ? "filled" : "outlined"} size="small"
                      sx={tournamentSportFilter === null ? { bgcolor: COLORS.accent, color: "#111", fontWeight: 700 } : { fontWeight: 600 }} />
                    {tournamentSports.map(sport => (
                      <Chip key={sport} label={SPORT_LABEL[sport as keyof typeof SPORT_LABEL] ?? sport} onClick={() => handleTournamentSportFilter(sport)} variant={tournamentSportFilter === sport ? "filled" : "outlined"} size="small"
                        sx={tournamentSportFilter === sport ? { bgcolor: COLORS.accent, color: "#111", fontWeight: 700 } : { fontWeight: 600 }} />
                    ))}
                  </Box>
                )}

                {/* Mobile: list, Desktop: grid */}
                <Box sx={{ display: { xs: "block", sm: "none" }, bgcolor: "#fff", border: `1px solid ${COLORS.lightBorder}`, borderRadius: 3, overflow: "hidden", mx: 2 }}>
                  {tournaments.map((t: any) => (
                    <PublicTournamentCard key={t.id} tournament={t} onSelect={setSelectedTournament} />
                  ))}
                </Box>
                <Grid container spacing={2} sx={{ display: { xs: "none", sm: "flex" } }}>
                  {tournaments.map((t: any) => (
                    <Grid size={{ sm: 6, md: 4 }} key={t.id}>
                      <PublicTournamentCard tournament={t} onSelect={setSelectedTournament} />
                    </Grid>
                  ))}
                </Grid>
                {tournamentPages > 1 && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Pagination count={tournamentPages} page={tournamentPage} onChange={(_, p) => setTournamentPage(p)} size="small" />
                  </Box>
                )}

                <Dialog
                  open={!!selectedTournament}
                  onClose={() => setSelectedTournament(null)}
                  maxWidth="md"
                  fullWidth
                  fullScreen={isMobile}
                  PaperProps={{ sx: { borderRadius: { xs: 0, sm: 3 } } }}
                >
                  <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>{selectedTournament?.name}</Typography>
                      {selectedTournament && (
                        <Typography variant="caption" color="text.secondary">
                          {formatDateRange(selectedTournament.startDate, selectedTournament.endDate)}
                        </Typography>
                      )}
                    </Box>
                    <IconButton size="small" onClick={() => setSelectedTournament(null)}><CloseIcon /></IconButton>
                  </DialogTitle>
                  <DialogContent sx={{ p: { xs: 1, sm: 2 }, overflow: "auto" }}>
                    {selectedTournament && (
                      <TournamentDetailView username={username!} tournament={selectedTournament} />
                    )}
                  </DialogContent>
                </Dialog>
              </Box>
            )}

            {/* Canchas */}
            {showSection("canchas") && (profile.showCourts ?? true) && (
              <Box id="section-canchas" sx={{ scrollMarginTop: "16px", px: { xs: 2, md: 0 }, pt: { xs: 2, md: 0 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: { xs: 2, md: 3 } }}>
                  <Box sx={{ width: 4, height: 26, bgcolor: COLORS.accent, borderRadius: 2, flexShrink: 0 }} />
                  <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.02em", color: COLORS.text }}>Canchas</Typography>
                </Box>
                <CourtsSection username={username!} businessHours={profile.businessHours} clubPhone={profile.phone} />
              </Box>
            )}

            {/* Profesores */}
            {showSection("profesores") && (profile.showProfesores ?? true) && (
              <Box id="section-profesores" sx={{ scrollMarginTop: "16px", px: { xs: 2, md: 0 }, pt: { xs: 2, md: 0 } }}>
                <ProfesoresSection username={username!} />
              </Box>
            )}

          </Box>
        </Box>
      </Box>

      <ClubInfoPanel clubName={profile.clubName} username={username!} address={profile.address} logoSrc={profile.logoUrl || profile.logoBase64} lat={profile.latitude} lng={profile.longitude} businessHours={profile.businessHours} phone={profile.phone} amenities={profile.amenities} />
      <MobileBottomNav items={visibleNavItems} activeId={activeSection} onSelect={handleNavSelect} />

    </Box>
  );
}
