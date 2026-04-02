import { useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DateRangeIcon from "@mui/icons-material/DateRange";
import EventNoteIcon from "@mui/icons-material/EventNote";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import { useQuery } from "@tanstack/react-query";
import { fetchRevenue } from "../../api/statsService";
import type { RevenueEntry, CourtOccupancy, OccupancySummary } from "../../api/statsService";
import PageHeader from "../../components/common/PageHeader";

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

function shortLabel(label: string, period: "daily" | "weekly" | "monthly") {
  if (period === "daily") {
    const [, m, d] = label.split("-");
    const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
  }
  if (period === "weekly") return label.replace(/^\d{4}-W/, "S");
  const [y, m] = label.split("-");
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

function RevenueChart({
  data,
  period,
}: {
  data: RevenueEntry[];
  period: "daily" | "weekly" | "monthly";
}) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const visible =
    period === "daily"
      ? (() => {
          const firstNonZero = data.findIndex((d) => d.revenue > 0);
          const start = firstNonZero === -1 ? data.length - 14 : Math.max(0, firstNonZero - 2);
          return data.slice(Math.max(start, data.length - 30));
        })()
      : data;

  return (
    <Box sx={{ mt: 2, overflowX: "auto", pb: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: period === "daily" ? "6px" : "10px",
          minWidth: period === "daily" ? visible.length * 32 : "auto",
          height: 160,
        }}
      >
        {visible.map((entry) => {
          const pct = max > 0 ? (entry.revenue / max) * 100 : 0;
          return (
            <Tooltip
              key={entry.label}
              title={
                <Box sx={{ fontSize: "0.78rem" }}>
                  <div><strong>{entry.label}</strong></div>
                  <div>Facturado: {fmt(entry.revenue)}</div>
                  <div>Reservas: {entry.bookings}</div>
                  <div>Horas: {entry.hours.toFixed(1)}</div>
                </Box>
              }
              arrow
            >
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "4px",
                  cursor: "default",
                  minWidth: period === "daily" ? 28 : 40,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: `${Math.max(pct, entry.revenue > 0 ? 4 : 0)}%`,
                    bgcolor: entry.revenue > 0 ? "#F5AD27" : "divider",
                    borderRadius: "3px 3px 0 0",
                    transition: "height 0.3s ease",
                    "&:hover": { bgcolor: entry.revenue > 0 ? "#e09b18" : undefined },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: period === "daily" ? "0.6rem" : "0.65rem",
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                    transform: period === "daily" ? "rotate(-45deg)" : "none",
                    transformOrigin: "top center",
                    mt: period === "daily" ? "8px" : 0,
                  }}
                >
                  {shortLabel(entry.label, period)}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}

// ── Occupancy chart (SVG donut + progress bars) ───────────────────────────────

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

function OccupancyChart({
  data,
  summary,
}: {
  data: CourtOccupancy[];
  summary: OccupancySummary;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (data.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Sin canchas registradas todavía.
        </Typography>
      </Box>
    );
  }

  const hasBookings = summary.totalBookedHours > 0;

  // Assign palette colors to each court
  const slices = data.map((d, i) => ({ ...d, color: PALETTE[i % PALETTE.length] }));

  type DonutSlice = (typeof slices)[number] & { startAngle: number; endAngle: number };

  // Build donut slices only when there are bookings
  let donutSlices: DonutSlice[] = [];
  if (hasBookings) {
    let cursor = 0;
    donutSlices = slices.map((s) => {
      const sweep = (s.share / 100) * 360;
      const slice: DonutSlice = { ...s, startAngle: cursor, endAngle: cursor + sweep };
      cursor += sweep;
      return slice;
    });
  }

  const active = hovered !== null && donutSlices.length > hovered ? donutSlices[hovered] : null;

  const SIZE = isMobile ? 160 : 200;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = isMobile ? 62 : 80;
  const R_INNER = isMobile ? 36 : 46;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 2 : 3,
          alignItems: isMobile ? "stretch" : "center",
        }}
      >
        {/* SVG donut — only when there are bookings */}
        {hasBookings && (
          <Box sx={{ flexShrink: 0, display: "flex", justifyContent: "center" }}>
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              {donutSlices.map((s, i) => (
                <path
                  key={s.courtId}
                  d={arcPath(cx, cy, hovered === i ? R + 6 : R, s.startAngle, s.endAngle)}
                  fill={s.color}
                  opacity={hovered !== null && hovered !== i ? 0.45 : 1}
                  style={{ transition: "all 0.15s ease", cursor: "pointer" }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}
              <circle cx={cx} cy={cy} r={R_INNER} fill="white" />

              {active ? (
                <>
                  <text x={cx} y={cy - 10} textAnchor="middle" fontSize={isMobile ? 9 : 10} fill="#666" fontWeight={600}>
                    {active.courtName.length > 12 ? active.courtName.slice(0, 12) + "…" : active.courtName}
                  </text>
                  <text x={cx} y={cy + 6} textAnchor="middle" fontSize={isMobile ? 13 : 15} fill="#111" fontWeight={800}>
                    {active.occupancyPct.toFixed(1)}%
                  </text>
                  <text x={cx} y={cy + 19} textAnchor="middle" fontSize={isMobile ? 9 : 10} fill="#888">
                    ocupación
                  </text>
                </>
              ) : (
                <>
                  <text x={cx} y={cy - 8} textAnchor="middle" fontSize={isMobile ? 10 : 10} fill="#888">
                    Ocupación
                  </text>
                  <text x={cx} y={cy + 10} textAnchor="middle" fontSize={isMobile ? 20 : 15} fill="#111" fontWeight={800}>
                    {summary.overallOccupancyPct.toFixed(1)}%
                  </text>
                  <text x={cx} y={cy + 25} textAnchor="middle" fontSize={isMobile ? 10 : 10} fill="#888">
                    general
                  </text>
                </>
              )}
            </svg>
          </Box>
        )}

        {/* Progress bars por cancha */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {slices.map((s, i) => (
            <Box
              key={s.courtId}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              sx={{
                mb: 1.5,
                px: 1,
                py: 0.75,
                borderRadius: 1.5,
                bgcolor: hovered === i ? "action.hover" : "transparent",
                transition: "background 0.15s",
                cursor: "default",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: s.color, flexShrink: 0 }} />
                <Typography variant="body2" fontWeight={hovered === i ? 700 : 500} sx={{ flex: 1, minWidth: 0 }} noWrap>
                  {s.courtName}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: s.color, flexShrink: 0 }}>
                  {s.occupancyPct.toFixed(1)}%
                </Typography>
              </Box>

              <Box sx={{ height: 6, bgcolor: "action.hover", borderRadius: 3, overflow: "hidden" }}>
                <Box
                  sx={{
                    height: "100%",
                    width: `${Math.min(s.occupancyPct, 100)}%`,
                    bgcolor: s.color,
                    borderRadius: 3,
                    transition: "width 0.4s ease",
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.4, gap: 1 }}>
                <Typography variant="caption" color="text.disabled" noWrap>
                  {isMobile
                    ? `${s.bookedHours.toFixed(1)}h / ${s.availableHours.toFixed(0)}h`
                    : `${s.bookedHours.toFixed(1)}h reservadas / ${s.availableHours.toFixed(0)}h disponibles`}
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
                  {s.bookings} {s.bookings === 1 ? "reserva" : "reservas"}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Divider sx={{ mt: 2, mb: 1.5 }} />
      <Typography variant="caption" color="text.secondary">
        {isMobile ? (
          <>
            {summary.availableHoursPerCourt.toFixed(0)}h disponibles · {summary.totalBookedHours.toFixed(1)}h reservadas
          </>
        ) : (
          <>
            Período: hoy · {summary.availableHoursPerCourt.toFixed(0)}h disponibles por cancha ·{" "}
            {summary.totalBookedHours.toFixed(1)}h totales reservadas
          </>
        )}
      </Typography>
    </Box>
  );
}

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{ border: "1.5px solid", borderColor: "divider", borderRadius: 3, flex: 1, minWidth: 140 }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, color: color ?? "#F5AD27" }}>
          {icon}
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
        </Box>
        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1 }}>
          {fmt(value)}
        </Typography>
      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TAB_OPTIONS = [
  { key: "daily",   label: "Por Día",    icon: <CalendarTodayIcon sx={{ fontSize: 16 }} /> },
  { key: "weekly",  label: "Por Semana", icon: <DateRangeIcon sx={{ fontSize: 16 }} /> },
  { key: "monthly", label: "Por Mes",    icon: <EventNoteIcon sx={{ fontSize: 16 }} /> },
] as const;

type Period = "daily" | "weekly" | "monthly";

export default function Stats() {
  const [period, setPeriod] = useState<Period>("monthly");

  const { data, isPending, isError } = useQuery({
    queryKey: ["stats", "revenue"],
    queryFn: fetchRevenue,
    staleTime: 60_000,
    retry: 1,
  });

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

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

  return (
    <Box maxWidth={860}>
      <PageHeader title="Estadísticas" subtitle="Facturación y ocupación de canchas" />

      {/* Summary cards */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <SummaryCard icon={<CalendarTodayIcon sx={{ fontSize: 18 }} />} label="Hoy"            value={data.totals.day} />
        <SummaryCard icon={<DateRangeIcon    sx={{ fontSize: 18 }} />} label="Esta semana"     value={data.totals.week} />
        <SummaryCard icon={<EventNoteIcon    sx={{ fontSize: 18 }} />} label="Este mes"        value={data.totals.month} />
        <SummaryCard icon={<AllInclusiveIcon sx={{ fontSize: 18 }} />} label="Total histórico" value={data.totals.allTime} color="text.secondary" />
      </Box>

      {/* Revenue chart card */}
      <Card elevation={0} sx={{ border: "1.5px solid", borderColor: "divider", borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <TrendingUpIcon sx={{ color: "#F5AD27" }} />
            <Typography variant="subtitle1" fontWeight={700}>Facturación</Typography>
            {data.hourlyRate > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                Precio/hora: {fmt(data.hourlyRate)}
              </Typography>
            )}
          </Box>

          <Tabs
            value={period}
            onChange={(_, v) => setPeriod(v)}
            sx={{
              mb: 1,
              minHeight: 36,
              "& .MuiTab-root": { minHeight: 36, textTransform: "none", fontSize: "0.8rem" },
            }}
          >
            {TAB_OPTIONS.map((t) => (
              <Tab key={t.key} value={t.key} label={t.label} icon={t.icon} iconPosition="start" />
            ))}
          </Tabs>

          <RevenueChart data={data[period]} period={period} />

          {/* Tabla */}
          <Box sx={{ mt: 3, overflowX: "auto" }}>
            <Box
              component="table"
              sx={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.82rem",
                "& th": { textAlign: "left", fontWeight: 700, color: "text.secondary", borderBottom: "1.5px solid", borderColor: "divider", py: 0.75, px: 1 },
                "& td": { py: 0.6, px: 1, borderBottom: "1px solid", borderColor: "divider" },
              }}
            >
              <thead>
                <tr>
                  <th>Período</th>
                  <th style={{ textAlign: "right" }}>Reservas</th>
                  <th style={{ textAlign: "right" }}>Horas</th>
                  <th style={{ textAlign: "right" }}>Facturado</th>
                </tr>
              </thead>
              <tbody>
                {[...data[period]].reverse().filter((e) => e.bookings > 0).map((entry) => (
                  <tr key={entry.label}>
                    <td><Typography variant="body2">{entry.label}</Typography></td>
                    <td style={{ textAlign: "right" }}><Typography variant="body2">{entry.bookings}</Typography></td>
                    <td style={{ textAlign: "right" }}><Typography variant="body2">{entry.hours.toFixed(1)}</Typography></td>
                    <td style={{ textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={600} color="success.main">{fmt(entry.revenue)}</Typography>
                    </td>
                  </tr>
                ))}
                {data[period].every((e) => e.bookings === 0) && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "1.5rem" }}>
                      <Typography variant="body2" color="text.secondary">Sin reservas en este período.</Typography>
                    </td>
                  </tr>
                )}
              </tbody>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Occupancy pie chart card */}
      <Card elevation={0} sx={{ border: "1.5px solid", borderColor: "divider", borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3, flexWrap: "wrap" }}>
            <DonutLargeIcon sx={{ color: "#F5AD27" }} />
            <Typography variant="subtitle1" fontWeight={700}>Ocupación por cancha</Typography>
          </Box>
          <OccupancyChart data={data.courtOccupancy} summary={data.occupancySummary} />
        </CardContent>
      </Card>
    </Box>
  );
}
