import { useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DateRangeIcon from "@mui/icons-material/DateRange";
import EventNoteIcon from "@mui/icons-material/EventNote";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ProfesorBillingCard from "./ProfesorBillingCard";
import { useQuery } from "@tanstack/react-query";
import { fetchRevenue, fetchProfesorStats, fetchPlayerStats } from "../../api/statsService";
import PageLoader from "../../components/common/PageLoader";
import type { CourtOccupancy, OccupancySummary, PlayerCategoryEntry } from "../../api/statsService";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../context/AuthContext";

// ── Palette ───────────────────────────────────────────────────────────────────

const PALETTE = [
  "#F5AD27", "#3B82F6", "#10B981", "#EF4444",
  "#8B5CF6", "#F97316", "#06B6D4", "#EC4899",
  "#84CC16", "#6366F1",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

const MONTHS = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

/** Given "YYYY-W##" returns the Monday Date of that ISO week */
function isoWeekMonday(weekStr: string): Date {
  const [yearStr, wStr] = weekStr.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay() === 0 ? 7 : jan4.getDay(); // 1=Mon..7=Sun
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - (dow - 1) + (week - 1) * 7);
  return monday;
}

/** Short x-axis label */
function shortLabel(label: string, period: "daily" | "weekly" | "monthly") {
  if (period === "daily") {
    const [, m, d] = label.split("-");
    return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]}`;
  }
  if (period === "weekly") {
    const mon = isoWeekMonday(label);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    if (mon.getMonth() === sun.getMonth()) {
      return `${mon.getDate()}–${sun.getDate()} ${MONTHS[mon.getMonth()]}`;
    }
    return `${mon.getDate()} ${MONTHS[mon.getMonth()]}–${sun.getDate()} ${MONTHS[sun.getMonth()]}`;
  }
  const [y, m] = label.split("-");
  return `${MONTHS[parseInt(m) - 1]} ${y.slice(2)}`;
}

// ── Shared chart card header ───────────────────────────────────────────────────

function ChartHeader({ icon, title, meta }: { icon: React.ReactNode; title: string; meta?: React.ReactNode }) {
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Box sx={{ color: "#F5AD27" }}>{icon}</Box>
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        {meta && <Box sx={{ ml: "auto" }}>{meta}</Box>}
      </Box>
      <Divider sx={{ mb: 2.5 }} />
    </>
  );
}

// ── Occupancy chart ───────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end   = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function OccupancyChart({ data, summary }: { data: CourtOccupancy[]; summary: OccupancySummary }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (data.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">Sin canchas registradas todavía.</Typography>
      </Box>
    );
  }

  const hasBookings = summary.totalBookedHours > 0;
  const slices = data.map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }));

  type DonutSlice = (typeof slices)[number] & { startAngle: number; endAngle: number };
  let donutSlices: DonutSlice[] = [];
  if (hasBookings) {
    let cursor = 0;
    donutSlices = slices.map((s) => {
      const sweep = (s.share / 100) * 360;
      const sl: DonutSlice = { ...s, startAngle: cursor, endAngle: cursor + sweep };
      cursor += sweep;
      return sl;
    });
  }

  const active = hovered !== null && donutSlices.length > hovered ? donutSlices[hovered] : null;
  const SZ = 200; const cx = SZ / 2; const cy = SZ / 2; const R = 82; const R_IN = 48;

  return (
    <Box>
      <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 3, alignItems: "flex-start" }}>
        {/* Donut */}
        {hasBookings && (
          <Box sx={{ flexShrink: 0, width: isMobile ? "100%" : 160, display: "flex", justifyContent: "center" }}>
            <svg viewBox={`0 0 ${SZ} ${SZ}`} width="100%" style={{ maxWidth: 180, display: "block", fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }}>
              {donutSlices.map((s, i) => (
                <path
                  key={s.courtId}
                  d={arcPath(cx, cy, hovered === i ? R + 7 : R, s.startAngle, s.endAngle)}
                  fill={s.color}
                  opacity={hovered !== null && hovered !== i ? 0.35 : 1}
                  style={{ transition: "all 0.15s ease", cursor: "pointer" }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}
              <circle cx={cx} cy={cy} r={R_IN} fill="white" />
              {active ? (
                <>
                  <text x={cx} y={cy - 10} textAnchor="middle" fontSize={9} fill="#666" fontWeight={600}>
                    {active.courtName.length > 12 ? active.courtName.slice(0, 12) + "…" : active.courtName}
                  </text>
                  <text x={cx} y={cy + 7} textAnchor="middle" fontSize={16} fill="#111" fontWeight={800}>
                    {active.occupancyPct.toFixed(1)}%
                  </text>
                  <text x={cx} y={cy + 20} textAnchor="middle" fontSize={9} fill="#888">ocupación</text>
                </>
              ) : (
                <>
                  <text x={cx} y={cy - 7} textAnchor="middle" fontSize={9} fill="#888">Ocupación</text>
                  <text x={cx} y={cy + 10} textAnchor="middle" fontSize={18} fill="#111" fontWeight={800}>
                    {summary.overallOccupancyPct.toFixed(1)}%
                  </text>
                  <text x={cx} y={cy + 24} textAnchor="middle" fontSize={9} fill="#888">general</text>
                </>
              )}
            </svg>
          </Box>
        )}

        {/* Progress bars */}
        <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
          {slices.map((s, i) => (
            <Box
              key={s.courtId}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              sx={{
                py: 0.75, px: 1, mb: 1, borderRadius: 1.5,
                bgcolor: hovered === i ? "action.hover" : "transparent",
                transition: "background 0.15s", cursor: "default",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: s.color, flexShrink: 0 }} />
                <Typography variant="body2" fontWeight={hovered === i ? 700 : 500} sx={{ flex: 1, minWidth: 0 }} noWrap>
                  {s.courtName}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: s.color, flexShrink: 0 }}>
                  {s.occupancyPct.toFixed(1)}%
                </Typography>
              </Box>
              <Box sx={{ height: 6, bgcolor: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                <Box sx={{ height: "100%", width: `${Math.min(s.occupancyPct, 100)}%`, bgcolor: s.color, borderRadius: 3, transition: "width 0.4s ease" }} />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.4 }}>
                <Typography variant="caption" color="text.disabled">
                  {s.bookedHours.toFixed(1)}h reservadas / {s.availableHours.toFixed(0)}h disponibles
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {s.bookings} {s.bookings === 1 ? "reserva" : "reservas"}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Divider sx={{ mt: 2, mb: 1.5 }} />
      <Typography variant="caption" color="text.secondary">
        Período: hoy · {summary.availableHoursPerCourt.toFixed(0)}h disponibles por cancha · {summary.totalBookedHours.toFixed(1)}h totales reservadas
      </Typography>
    </Box>
  );
}

// ── Player category chart ─────────────────────────────────────────────────────

const CAT_LABEL: Record<string, string> = {
  PRIMERA: "1ra", SEGUNDA: "2da", TERCERA: "3ra", CUARTA: "4ta",
  QUINTA: "5ta", SEXTA: "6ta", SEPTIMA: "7ma", SIN_CATEGORIA: "S/C",
};
const COLOR_M = "#3B82F6";
const COLOR_F = "#EC4899";

function PlayerCategoryChart({ data }: { data: PlayerCategoryEntry[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (data.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">Sin jugadores registrados todavía.</Typography>
      </Box>
    );
  }

  const maxVal  = Math.max(...data.map((d) => Math.max(d.masculino, d.femenino)), 1);
  const totalM  = data.reduce((s, d) => s + d.masculino, 0);
  const totalF  = data.reduce((s, d) => s + d.femenino, 0);
  const total   = totalM + totalF;

  const CHART_H  = 160;
  const LABEL_H  = 36;
  const Y_AXIS_W = 24;
  const GRID_N   = 4;
  const n        = data.length;
  const GROUP_GAP = 12;
  const BAR_GAP   = 3;
  // Natural canvas: each group gets equal space
  const NATURAL_W = Math.max(n * (40 + GROUP_GAP) + Y_AXIS_W + 8, 260);
  const groupW    = (NATURAL_W - Y_AXIS_W - GROUP_GAP * (n + 1)) / n;
  const barW      = (groupW - BAR_GAP) / 2;

  const hoveredEntry = hovered ? data.find((d) => d.category === hovered) : null;

  return (
    <Box>
      {/* Legend */}
      <Box sx={{ display: "flex", gap: 2.5, mb: 2 }}>
        {[{ color: COLOR_M, label: "Masculino" }, { color: COLOR_F, label: "Femenino" }].map(({ color, label }) => (
          <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "2px", bgcolor: color }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
          </Box>
        ))}
      </Box>

      {/* SVG chart fills container */}
      <svg
        viewBox={`0 0 ${NATURAL_W} ${CHART_H + LABEL_H}`}
        width="100%"
        style={{ display: "block", overflow: "visible", fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }}
      >
        {/* Grid lines + Y labels */}
        {Array.from({ length: GRID_N + 1 }).map((_, i) => {
          const y = (CHART_H / GRID_N) * i;
          const val = Math.round(maxVal * (1 - i / GRID_N));
          return (
            <g key={i}>
              <line x1={Y_AXIS_W} y1={y} x2={NATURAL_W} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              {val > 0 && (
                <text x={Y_AXIS_W - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#bbb">{val}</text>
              )}
            </g>
          );
        })}

        {/* Groups */}
        {data.map((entry, i) => {
          const isHov = hovered === entry.category;
          const xGroup = Y_AXIS_W + GROUP_GAP + i * (groupW + GROUP_GAP);
          const xM = xGroup;
          const xF = xGroup + barW + BAR_GAP;
          const hM = entry.masculino > 0 ? Math.max((entry.masculino / maxVal) * CHART_H, 3) : 0;
          const hF = entry.femenino  > 0 ? Math.max((entry.femenino  / maxVal) * CHART_H, 3) : 0;
          const cxGroup = xGroup + groupW / 2;

          return (
            <g
              key={entry.category}
              onMouseEnter={() => setHovered(entry.category)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "default" }}
            >
              {/* Hit area */}
              <rect x={xGroup - 4} y={0} width={groupW + 8} height={CHART_H} fill="transparent" />

              {/* Masculino bar */}
              <rect
                x={xM} y={CHART_H - hM} width={barW} height={hM} rx={2}
                fill={COLOR_M} opacity={hovered && !isHov ? 0.3 : 1}
                style={{ transition: "opacity 0.15s" }}
              />
              {/* Femenino bar */}
              <rect
                x={xF} y={CHART_H - hF} width={barW} height={hF} rx={2}
                fill={COLOR_F} opacity={hovered && !isHov ? 0.3 : 1}
                style={{ transition: "opacity 0.15s" }}
              />

              {/* Value labels on hover */}
              {isHov && entry.masculino > 0 && (
                <text x={xM + barW / 2} y={CHART_H - hM - 4} textAnchor="middle" fontSize={9} fill={COLOR_M} fontWeight={700}>{entry.masculino}</text>
              )}
              {isHov && entry.femenino > 0 && (
                <text x={xF + barW / 2} y={CHART_H - hF - 4} textAnchor="middle" fontSize={9} fill={COLOR_F} fontWeight={700}>{entry.femenino}</text>
              )}

              {/* Category label */}
              <text
                x={cxGroup} y={CHART_H + 15}
                textAnchor="middle" fontSize={11}
                fill={isHov ? "#111" : "#888"} fontWeight={isHov ? 700 : 400}
                style={{ transition: "fill 0.15s" }}
              >
                {CAT_LABEL[entry.category] ?? entry.category}
              </text>
              {/* Total below label */}
              <text x={cxGroup} y={CHART_H + 28} textAnchor="middle" fontSize={9} fill="#bbb">
                {entry.total}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line x1={Y_AXIS_W} y1={CHART_H} x2={NATURAL_W} y2={CHART_H} stroke="#d1d5db" strokeWidth={1.5} />
      </svg>

      {/* Hover detail */}
      <Box sx={{ minHeight: 28, mt: 0.5 }}>
        {hoveredEntry ? (
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", px: 0.5 }}>
            <Typography variant="caption" fontWeight={700}>{CAT_LABEL[hoveredEntry.category] ?? hoveredEntry.category}</Typography>
            <Typography variant="caption" sx={{ color: COLOR_M }}>Masculino: <strong>{hoveredEntry.masculino}</strong></Typography>
            <Typography variant="caption" sx={{ color: COLOR_F }}>Femenino: <strong>{hoveredEntry.femenino}</strong></Typography>
            <Typography variant="caption" color="text.secondary">Total: <strong>{hoveredEntry.total}</strong></Typography>
          </Box>
        ) : (
          <Typography variant="caption" color="text.disabled" sx={{ px: 0.5 }}>
            Pasá el cursor sobre una categoría para ver el detalle
          </Typography>
        )}
      </Box>

      <Divider sx={{ mt: 1.5, mb: 1.5 }} />
      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        <Typography variant="caption" color="text.secondary">Total: <strong>{total}</strong></Typography>
        <Typography variant="caption" sx={{ color: COLOR_M }}>Masculino: <strong>{totalM}</strong></Typography>
        <Typography variant="caption" sx={{ color: COLOR_F }}>Femenino: <strong>{totalF}</strong></Typography>
      </Box>
    </Box>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  const accent = color ?? "#F5AD27";
  return (
    <Card elevation={0} sx={{ border: "1.5px solid", borderColor: "divider", borderRadius: 3, height: "100%" }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Box sx={{
            width: 30, height: 30, borderRadius: 1.5, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            bgcolor: `${accent}22`, color: accent,
          }}>
            {icon}
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>{label}</Typography>
        </Box>
        <Typography
          fontWeight={800}
          noWrap
          sx={{ lineHeight: 1.1, fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" } }}
        >
          {fmt(value)}
        </Typography>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TAB_OPTIONS = [
  { key: "daily",   label: "Diario"  },
  { key: "weekly",  label: "Semanal" },
  { key: "monthly", label: "Mensual" },
] as const;

type Period = "daily" | "weekly" | "monthly";

export default function Stats() {
  const [period, setPeriod] = useState<Period>("monthly");
  const { user } = useAuth();
  const sports = user?.sports ?? ["PADEL"];
  const hasPadel = sports.includes("PADEL");
  const hasRacketSport = sports.includes("PADEL") || sports.includes("TENIS");

  const { data, isPending, isError } = useQuery({
    queryKey: ["stats", "revenue"],
    queryFn: fetchRevenue,
    staleTime: 60_000,
    retry: 1,
  });

  const { data: profesorData, isPending: profesorPending, isError: profesorError } = useQuery({
    queryKey: ["stats", "profesores"],
    queryFn: fetchProfesorStats,
    staleTime: 60_000,
    retry: 1,
  });

  const { data: playerData, isPending: playerPending, isError: playerError } = useQuery({
    queryKey: ["stats", "players"],
    queryFn: fetchPlayerStats,
    staleTime: 60_000,
    retry: 1,
  });

  if (isPending) return <PageLoader />;

  if (isError || !data) {
    return (
      <Box>
        <PageHeader title="Estadísticas" subtitle="Facturación y ocupación de canchas" />
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          No se pudieron cargar las estadísticas. Verificá que el backend esté corriendo.
        </Alert>
      </Box>
    );
  }

  const cardSx = { border: "1.5px solid", borderColor: "divider", borderRadius: 3 };
  const periodData = period === "monthly" ? data.monthly.slice(-6) : data[period];

  return (
    <Box>
      <PageHeader title="Estadísticas" subtitle="Facturación y ocupación de canchas" />

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 4 }}>
          <SummaryCard icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />} label="Hoy"        value={data.totals.day} />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <SummaryCard icon={<DateRangeIcon    sx={{ fontSize: 18 }} />} label="Esta semana" value={data.totals.week} />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <SummaryCard icon={<EventNoteIcon    sx={{ fontSize: 18 }} />} label="Este mes"    value={data.totals.month} />
        </Grid>
      </Grid>

      {/* Row 1: Facturación + Ocupación */}
      <Grid container spacing={3} alignItems="flex-start" sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card elevation={0} sx={cardSx}>
            <CardContent sx={{ p: 3 }}>
              <ChartHeader
                icon={<TrendingUpIcon />}
                title="Facturación"
                meta={data.hourlyRate > 0 && (
                  <Typography variant="caption" color="text.secondary">Precio/hora: {fmt(data.hourlyRate)}</Typography>
                )}
              />

              <Tabs
                value={period}
                onChange={(_, v) => setPeriod(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 2, minHeight: 34, "& .MuiTab-root": { minHeight: 34, textTransform: "none", fontSize: "0.82rem" } }}
              >
                {TAB_OPTIONS.map((t) => (
                  <Tab key={t.key} value={t.key} label={t.label} />
                ))}
              </Tabs>

              {(() => {
                // Build a map label → previous period revenue (chronological order)
                const trendMap = new Map<string, number | null>();
                periodData.forEach((e, i) => {
                  trendMap.set(e.label, i > 0 ? periodData[i - 1].revenue : null);
                });

                const rows = [...periodData].reverse().filter((e) => e.bookings > 0);

                return (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Período</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Reservas</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.8rem", display: { xs: "none", sm: "table-cell" } }}>Horas</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Facturado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((entry) => {
                          const prev = trendMap.get(entry.label) ?? null;
                          const diff = prev !== null ? entry.revenue - prev : null;
                          const pct  = diff !== null && prev! > 0 ? (diff / prev!) * 100 : null;
                          const isUp = diff !== null && diff > 0;
                          const isDown = diff !== null && diff < 0;

                          return (
                            <TableRow key={entry.label} sx={{ "&:hover": { bgcolor: "action.hover" } }}>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                  <Typography variant="body2">{shortLabel(entry.label, period)}</Typography>
                                  {(isUp || isDown) && pct !== null && (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                      {isUp
                                        ? <ArrowUpwardIcon sx={{ fontSize: 12, color: "success.main" }} />
                                        : <ArrowDownwardIcon sx={{ fontSize: 12, color: "error.main" }} />
                                      }
                                      <Typography variant="caption" sx={{ fontSize: "0.68rem", color: isUp ? "success.main" : "error.main", lineHeight: 1 }}>
                                        {Math.abs(pct).toFixed(0)}%
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">{entry.bookings}</Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                                <Typography variant="body2">{entry.hours.toFixed(1)}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight={600}>{fmt(entry.revenue)}</Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {periodData.every((e) => e.bookings === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ textAlign: "center", py: 3 }}>
                              <Typography variant="body2" color="text.secondary">Sin reservas en este período.</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                );
              })()}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card elevation={0} sx={cardSx}>
            <CardContent sx={{ p: 3 }}>
              <ChartHeader icon={<DonutLargeIcon />} title="Ocupación por cancha" />
              <OccupancyChart data={data.courtOccupancy} summary={data.occupancySummary} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Row 2: Profesor billing + Player distribution */}
      {(hasRacketSport || hasPadel) && (
        <Grid container spacing={3} alignItems="flex-start" sx={{ mb: 3 }}>
          {hasRacketSport && (
            <Grid size={{ xs: 12, md: hasPadel ? 7 : 12 }}>
              <ProfesorBillingCard data={profesorData ?? []} isLoading={profesorPending} isError={profesorError} />
            </Grid>
          )}
          {hasPadel && (
            <Grid size={{ xs: 12, md: hasRacketSport ? 5 : 12 }}>
              <Card elevation={0} sx={cardSx}>
                <CardContent sx={{ p: 3 }}>
                  <ChartHeader
                    icon={<PeopleAltIcon />}
                    title="Jugadores por Categoría"
                    meta={!playerPending && !playerError && playerData && (
                      <Typography variant="caption" color="text.secondary">
                        {playerData.reduce((s, d) => s + d.total, 0)} en total
                      </Typography>
                    )}
                  />
                  {playerPending && <PageLoader />}
                  {playerError && (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                      No se pudieron cargar los datos de jugadores.
                    </Alert>
                  )}
                  {!playerPending && !playerError && (
                    <PlayerCategoryChart data={playerData ?? []} />
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
