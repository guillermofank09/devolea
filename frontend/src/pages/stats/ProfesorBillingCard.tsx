import { useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SchoolIcon from "@mui/icons-material/School";
import type { ProfesorBillingEntry } from "../../api/statsService";

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 45%, 40%)`;
}

interface Props {
  data: ProfesorBillingEntry[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function ProfesorBillingCard({ data, isLoading, isError }: Props) {
  const [search, setSearch] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const filtered = data.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const max = Math.max(...filtered.map((p) => p.monthlyRevenue), 1);
  const totalMonthly = filtered.reduce((s, p) => s + p.monthlyRevenue, 0);

  return (
    <Card elevation={0} sx={{ border: "1.5px solid", borderColor: "divider", borderRadius: 3, mt: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
          <SchoolIcon sx={{ color: "#F5AD27" }} />
          <Typography variant="subtitle1" fontWeight={700}>
            Facturación por Profesor
          </Typography>
          {!isLoading && !isError && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
              Este mes · total {fmt(totalMonthly)}
            </Typography>
          )}
        </Box>

        {isLoading && (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {isError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            No se pudieron cargar los datos de profesores.
          </Alert>
        )}

        {!isLoading && !isError && (
          <>
        {/* Search */}
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar profesor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2.5, "& .MuiInputBase-root": { height: 38, fontSize: "0.875rem" } }}
        />

        {filtered.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {data.length === 0
                ? "No hay profesores registrados."
                : "No se encontraron profesores con ese nombre."}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Bar chart rows */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {filtered.map((p) => {
                const pct = max > 0 ? (p.monthlyRevenue / max) * 100 : 0;
                const color = stringToColor(p.name);
                return (
                  <Tooltip
                    key={p.profesorId}
                    title={
                      <Box sx={{ fontSize: "0.78rem" }}>
                        <div><strong>{p.name}</strong></div>
                        <div>Clases este mes: {p.monthlyClasses}</div>
                        <div>Horas este mes: {p.monthlyHours.toFixed(1)}</div>
                        <div>Tarifa: {fmt(p.effectiveRate)}/h {p.ownRate == null ? "(general)" : "(propia)"}</div>
                        <div>Facturado mes: {fmt(p.monthlyRevenue)}</div>
                        <div>Facturado total: {fmt(p.allTimeRevenue)}</div>
                      </Box>
                    }
                    arrow
                    placement="top"
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        cursor: "default",
                        px: 1,
                        py: 0.75,
                        borderRadius: 2,
                        "&:hover": { bgcolor: "action.hover" },
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Avatar */}
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          bgcolor: color,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(p.name)}
                      </Box>

                      {/* Name + bar */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>
                            {p.name}
                          </Typography>
                          {p.ownRate != null && (
                            <Chip
                              label={`${fmt(p.ownRate)}/h`}
                              size="small"
                              sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}
                            />
                          )}
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ flex: 1, height: 7, bgcolor: "action.hover", borderRadius: 3, overflow: "hidden" }}>
                            <Box
                              sx={{
                                height: "100%",
                                width: `${Math.max(pct, p.monthlyRevenue > 0 ? 2 : 0)}%`,
                                bgcolor: color,
                                borderRadius: 3,
                                transition: "width 0.4s ease",
                              }}
                            />
                          </Box>
                          <Typography variant="caption" fontWeight={700} sx={{ color, flexShrink: 0, minWidth: isMobile ? 70 : 90, textAlign: "right" }}>
                            {fmt(p.monthlyRevenue)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.disabled">
                          {p.monthlyClasses} {p.monthlyClasses === 1 ? "clase" : "clases"} · {p.monthlyHours.toFixed(1)}h
                        </Typography>
                      </Box>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>

            {/* Summary table */}
            <Box
              component="table"
              sx={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.82rem",
                mt: 3,
                "& th": { textAlign: "left", fontWeight: 700, color: "text.secondary", borderBottom: "1.5px solid", borderColor: "divider", py: 0.75, px: 1 },
                "& td": { py: 0.6, px: 1, borderBottom: "1px solid", borderColor: "divider" },
              }}
            >
              <thead>
                <tr>
                  <th>Profesor</th>
                  {!isMobile && <th style={{ textAlign: "right" }}>Tarifa/h</th>}
                  <th style={{ textAlign: "right" }}>Clases</th>
                  <th style={{ textAlign: "right" }}>Horas</th>
                  <th style={{ textAlign: "right" }}>Este mes</th>
                  {!isMobile && <th style={{ textAlign: "right" }}>Total histórico</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.profesorId}>
                    <td><Typography variant="body2" fontWeight={500}>{p.name}</Typography></td>
                    {!isMobile && (
                      <td style={{ textAlign: "right" }}>
                        <Typography variant="body2" color="text.secondary">{fmt(p.effectiveRate)}</Typography>
                      </td>
                    )}
                    <td style={{ textAlign: "right" }}>
                      <Typography variant="body2">{p.monthlyClasses}</Typography>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Typography variant="body2">{p.monthlyHours.toFixed(1)}</Typography>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={600} color="success.main">{fmt(p.monthlyRevenue)}</Typography>
                    </td>
                    {!isMobile && (
                      <td style={{ textAlign: "right" }}>
                        <Typography variant="body2" color="text.secondary">{fmt(p.allTimeRevenue)}</Typography>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Box>
          </>
        )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
