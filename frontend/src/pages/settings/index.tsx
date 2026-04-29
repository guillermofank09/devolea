import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useToast } from "../../context/ToastContext";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import SportsTennisOutlinedIcon from "@mui/icons-material/SportsTennisOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSettings, saveSettings } from "../../api/settingsService";
import { fetchCourts } from "../../api/courtService";
import type { AppSettings } from "../../types/AppSettings";
import type { Court } from "../../types/Court";
import PageHeader from "../../components/common/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import { useAuth } from "../../context/AuthContext";
import { SPORT_LABEL } from "../../constants/sports";

const SPORTS_WITH_CLASS = ["PADEL", "TENIS", "FUTBOL", "BASQUET", "VOLEY"];
const SPORTS_WITH_SETS  = ["PADEL", "TENIS", "VOLEY"];

const FUTBOL_TYPE_LABEL: Record<string, string> = {
  FUTBOL5: "Fútbol 5", FUTBOL7: "Fútbol 7", FUTBOL9: "Fútbol 9", FUTBOL11: "Fútbol 11",
};


/** Court price rows derived from actual courts in the system */
function toPriceRows(courts: Court[], sports: string[]): { key: string; label: string }[] {
  const seen = new Set<string>();
  const rows: { key: string; label: string }[] = [];
  for (const sport of sports) {
    const sportCourts = courts.filter(c => c.sport === sport);
    if (sport === "FUTBOL") {
      const types = [...new Set(sportCourts.map(c => c.type as string).filter(t => t.startsWith("FUTBOL")))];
      for (const t of types) {
        if (!seen.has(t)) { seen.add(t); rows.push({ key: t, label: FUTBOL_TYPE_LABEL[t] ?? t }); }
      }
    } else if (sportCourts.length > 0) {
      if (!seen.has(sport)) { seen.add(sport); rows.push({ key: sport, label: SPORT_LABEL[sport as keyof typeof SPORT_LABEL] ?? sport }); }
    }
  }
  return rows;
}

/** Tournament rows — like toPriceRows but always includes every sport (FUTBOL expands into sub-types by court) */
function toTournamentRows(courts: Court[], sports: string[]): { key: string; label: string }[] {
  const seen = new Set<string>();
  const rows: { key: string; label: string }[] = [];
  for (const sport of sports) {
    if (sport === "FUTBOL") {
      const sportCourts = courts.filter(c => c.sport === "FUTBOL");
      const types = [...new Set(sportCourts.map(c => c.type as string).filter(t => t?.startsWith("FUTBOL")))];
      if (types.length > 0) {
        for (const t of types) {
          if (!seen.has(t)) { seen.add(t); rows.push({ key: t, label: FUTBOL_TYPE_LABEL[t] ?? t }); }
        }
      } else {
        if (!seen.has("FUTBOL")) { seen.add("FUTBOL"); rows.push({ key: "FUTBOL", label: "Fútbol" }); }
      }
    } else {
      if (!seen.has(sport)) { seen.add(sport); rows.push({ key: sport, label: SPORT_LABEL[sport as keyof typeof SPORT_LABEL] ?? sport }); }
    }
  }
  return rows;
}


// ─── Section card wrapper ─────────────────────────────────────────────────────
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card elevation={0} sx={{ border: "1.5px solid", borderColor: "divider", borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
          <Box sx={{ color: "#F5AD27" }}>{icon}</Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        </Box>
        <Divider sx={{ mb: 2.5 }} />
        {children}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Settings() {
  const { user } = useAuth();
  const clubSports = user?.sports ?? ["PADEL"];
  const sportsWithClass = clubSports.filter(s => SPORTS_WITH_CLASS.includes(s));
  const qc = useQueryClient();
  const showToast = useToast();

  const { data, isPending, isError } = useQuery<AppSettings>({
    queryKey: ["appSettings"],
    queryFn: fetchSettings,
    retry: 1,
    staleTime: 30_000,
  });

  const { data: courts = [] } = useQuery<Court[]>({
    queryKey: ["courtsData"],
    queryFn: () => fetchCourts(),
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appSettings"] });
      showToast("Ajustes guardados correctamente");
    },
    onError: () => showToast("Error al guardar. Intentá de nuevo.", "error"),
  });

  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [classHourlyRate, setClassHourlyRate] = useState<string>("");
  const [sportPrices, setSportPrices] = useState<Record<string, number>>({});
  const [sportClassPrices, setSportClassPrices] = useState<Record<string, number>>({});
  const [showTournaments, setShowTournaments] = useState<boolean>(true);
  const [showCourts, setShowCourts] = useState<boolean>(true);
  const [showProfesores, setShowProfesores] = useState<boolean>(true);
  const [tournamentMatchDuration, setTournamentMatchDuration] = useState<string>("60");
  const [tournamentDurations, setTournamentDurations] = useState<Record<string, number>>({});
  const [tournamentSetsCount, setTournamentSetsCount] = useState<number>(3);
  const [tournamentSets, setTournamentSets] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!data) return;
    const rate = Number(data.hourlyRate);
    const classRate = Number(data.classHourlyRate);
    setHourlyRate(rate > 0 ? String(rate) : "");
    setClassHourlyRate(classRate > 0 ? String(classRate) : "");
    setSportPrices(data.sportPrices ?? {});
    setSportClassPrices(data.sportClassPrices ?? {});
    setShowTournaments(data.showTournaments ?? true);
    setShowCourts(data.showCourts ?? true);
    setShowProfesores(data.showProfesores ?? true);
    setTournamentMatchDuration(String(data.tournamentMatchDuration ?? 60));
    setTournamentDurations(data.tournamentDurations ?? {});
    setTournamentSetsCount(data.tournamentSetsCount ?? 3);
    setTournamentSets(data.tournamentSets ?? {});
  }, [data]);

  function handleSave() {
    mutation.mutate({
      hourlyRate: Number(hourlyRate) || 0,
      classHourlyRate: Number(classHourlyRate) || 0,
      sportPrices,
      sportClassPrices,
      showTournaments,
      showCourts,
      showProfesores,
      tournamentMatchDuration: Number(tournamentMatchDuration) || 60,
      tournamentDurations,
      tournamentSetsCount,
      tournamentSets,
      shareSchedules: false
    });
  }


  if (isPending) return <PageLoader />;

  if (isError) {
    return (
      <Box>
        <PageHeader title="Ajustes" subtitle="Configuración general de la aplicación" />
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          No se pudo conectar con el servidor. Verificá que el backend esté corriendo.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title="Ajustes" subtitle="Configuración general de la aplicación" />

      <Grid container spacing={3} alignItems="flex-start">
        {/* ── Left column ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* ── Precios de canchas ── */}
          <Section icon={<MonetizationOnOutlinedIcon />} title="Precios de canchas">
            {(() => {
              const courtRows = toPriceRows(courts, clubSports);
              if (courtRows.length === 0) {
                return (
                  <Typography variant="body2" color="text.secondary">
                    No hay canchas cargadas. Agregá canchas para configurar sus precios.
                  </Typography>
                );
              }
              const showLabels = courtRows.length > 1;
              const inputSx = { width: { xs: "100%", sm: 160 } };
              return (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography variant="caption" color="text.disabled" fontWeight={700}
                    sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem" }}>
                    Precio / hora
                  </Typography>
                  {courtRows.map(row => (
                    <Box key={row.key} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {showLabels && (
                        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 90 }}>{row.label}</Typography>
                      )}
                      <TextField
                        type="text" inputMode="decimal" size="small" placeholder="0"
                        value={sportPrices[row.key] != null ? String(sportPrices[row.key]) : ""}
                        onChange={e => {
                          const raw = e.target.value;
                          if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                            const val = raw.replace(/^0+(\d)/, "$1");
                            setSportPrices(prev => { const n = { ...prev }; if (val === "") delete n[row.key]; else n[row.key] = Number(val); return n; });
                          }
                        }}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                        sx={inputSx}
                      />
                    </Box>
                  ))}
                </Box>
              );
            })()}
          </Section>

          {/* ── Precios de clases / entrenamiento ── */}
          {toPriceRows(courts, sportsWithClass).length > 0 && (() => {
            const classRows = toPriceRows(courts, sportsWithClass);
            const showLabels = classRows.length > 1;
            const inputSx = { width: { xs: "100%", sm: 160 } };
            return (
              <Section icon={<SchoolOutlinedIcon />} title="Precios de clases">
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: "0.82rem" }}>
                    Precio por hora de clase o entrenamiento con profesor. Se aplica automáticamente al crear reservas de profesores.
                  </Typography>
                  <Typography variant="caption" color="text.disabled" fontWeight={700}
                    sx={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem" }}>
                    Precio / hora
                  </Typography>
                  {classRows.map(row => (
                    <Box key={row.key} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {showLabels && (
                        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 90 }}>{row.label}</Typography>
                      )}
                      <TextField
                        type="text" inputMode="decimal" size="small" placeholder="0"
                        value={sportClassPrices[row.key] != null ? String(sportClassPrices[row.key]) : ""}
                        onChange={e => {
                          const raw = e.target.value;
                          if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                            const val = raw.replace(/^0+(\d)/, "$1");
                            setSportClassPrices(prev => { const n = { ...prev }; if (val === "") delete n[row.key]; else n[row.key] = Number(val); return n; });
                          }
                        }}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                        sx={inputSx}
                      />
                    </Box>
                  ))}
                </Box>
              </Section>
            );
          })()}

          {/* ── Torneos ── */}
          <Section icon={<EmojiEventsOutlinedIcon />} title="Torneos">
            {(() => {
              const tournamentRows = toTournamentRows(courts, clubSports);
              const showLabel = tournamentRows.length > 1;

              if (tournamentRows.length === 1 && !SPORTS_WITH_SETS.includes(tournamentRows[0].key)) {
                // Single row, no sets — simple layout
                const { key } = tournamentRows[0];
                return (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
                        Duración de partidos
                      </Typography>
                      <TextField
                        type="text" inputMode="numeric" size="small" placeholder="60"
                        value={tournamentDurations[key] != null ? String(tournamentDurations[key]) : ""}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === "" || /^\d+$/.test(v)) {
                            setTournamentDurations(prev => { const n = { ...prev }; if (v === "") delete n[key]; else n[key] = Number(v); return n; });
                          }
                        }}
                        slotProps={{
                          input: { endAdornment: <InputAdornment position="end">min</InputAdornment> },
                          formHelperText: { sx: { ml: 0, mt: 0.5, fontSize: "0.72rem" } },
                        }}
                        helperText="Tiempo por partido de torneo"
                        sx={{ width: { xs: "100%", sm: 200 } }}
                      />
                    </Box>
                  </Box>
                );
              }

              if (tournamentRows.length === 1 && SPORTS_WITH_SETS.includes(tournamentRows[0].key)) {
                // Single row with sets (e.g. PADEL solo) — detailed layout
                const { key } = tournamentRows[0];
                return (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
                        Duración de partidos
                      </Typography>
                      <TextField
                        type="text" inputMode="numeric" size="small" placeholder="60"
                        value={tournamentDurations[key] != null ? String(tournamentDurations[key]) : ""}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === "" || /^\d+$/.test(v)) {
                            setTournamentDurations(prev => { const n = { ...prev }; if (v === "") delete n[key]; else n[key] = Number(v); return n; });
                          }
                        }}
                        slotProps={{
                          input: { endAdornment: <InputAdornment position="end">min</InputAdornment> },
                          formHelperText: { sx: { ml: 0, mt: 0.5, fontSize: "0.72rem" } },
                        }}
                        helperText="Tiempo por partido de torneo"
                        sx={{ width: { xs: "100%", sm: 200 } }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
                        Cantidad de sets
                      </Typography>
                      <ToggleButtonGroup
                        value={tournamentSets[key] ?? 3}
                        exclusive
                        onChange={(_, val) => { if (val !== null) setTournamentSets(prev => ({ ...prev, [key]: val })); }}
                        size="small"
                        sx={{
                          "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 600, px: 2 },
                          "& .MuiToggleButton-root.Mui-selected": { bgcolor: "#F5AD27", color: "#111", "&:hover": { bgcolor: "#e09b18" } },
                        }}
                      >
                        <ToggleButton value={1}>Mejor de 1</ToggleButton>
                        <ToggleButton value={3}>Mejor de 3</ToggleButton>
                        <ToggleButton value={5}>Mejor de 5</ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  </Box>
                );
              }

              // Multiple rows — compact table layout
              return (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {tournamentRows.map(({ key, label }) => {
                    const hasSets = SPORTS_WITH_SETS.includes(key);
                    return (
                      <Box key={key} sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: { xs: 1, sm: 2 }, py: 0.5, borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: "none" } }}>
                        {showLabel && (
                          <Typography variant="body2" fontWeight={600} sx={{ minWidth: { sm: 90 } }}>
                            {label}
                          </Typography>
                        )}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.disabled" fontWeight={700}
                              sx={{ display: { sm: "none" }, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.62rem", mb: 0.5 }}>
                              Duración
                            </Typography>
                            <TextField
                              type="text" inputMode="numeric" size="small" placeholder="60"
                              value={tournamentDurations[key] != null ? String(tournamentDurations[key]) : ""}
                              onChange={e => {
                                const v = e.target.value;
                                if (v === "" || /^\d+$/.test(v)) {
                                  setTournamentDurations(prev => { const n = { ...prev }; if (v === "") delete n[key]; else n[key] = Number(v); return n; });
                                }
                              }}
                              slotProps={{ input: { endAdornment: <InputAdornment position="end">min</InputAdornment> } }}
                              sx={{ width: 130, flexShrink: 0 }}
                            />
                          </Box>
                          {hasSets && (
                            <Box>
                              <Typography variant="caption" color="text.disabled" fontWeight={700}
                                sx={{ display: { sm: "none" }, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.62rem", mb: 0.5 }}>
                                Sets
                              </Typography>
                              <ToggleButtonGroup
                                value={tournamentSets[key] ?? 3}
                                exclusive
                                onChange={(_, val) => { if (val !== null) setTournamentSets(prev => ({ ...prev, [key]: val })); }}
                                size="small"
                                sx={{
                                  "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 600, px: 1.5, fontSize: "0.78rem" },
                                  "& .MuiToggleButton-root.Mui-selected": { bgcolor: "#F5AD27", color: "#111", "&:hover": { bgcolor: "#e09b18" } },
                                }}
                              >
                                <ToggleButton value={1}>1</ToggleButton>
                                <ToggleButton value={3}>3</ToggleButton>
                                <ToggleButton value={5}>5</ToggleButton>
                              </ToggleButtonGroup>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              );
            })()}
          </Section>
        </Grid>

        {/* ── Right column ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* ── Visibilidad Pública ── */}
          <Section icon={<PublicOutlinedIcon />} title="Visibilidad Pública">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                {
                  checked: showTournaments,
                  onChange: setShowTournaments,
                  icon: <EmojiEventsOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />,
                  label: "Mostrar torneos",
                  description: "Muestra la sección de torneos activos en la página pública.",
                },
                {
                  checked: showCourts,
                  onChange: setShowCourts,
                  icon: <SportsTennisOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />,
                  label: "Mostrar disponibilidad de canchas",
                  description: "Muestra el calendario de disponibilidad en la página pública.",
                },
                {
                  checked: showProfesores,
                  onChange: setShowProfesores,
                  icon: <SchoolOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />,
                  label: "Mostrar profesores",
                  description: "Muestra los profesores del club en la página pública.",
                },
              ].map(({ checked, onChange, icon, label, description }, i, arr) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    py: 1.75,
                    borderBottom: i < arr.length - 1 ? "1px solid" : "none",
                    borderColor: "divider",
                  }}
                >
                  <Switch
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    sx={{
                      flexShrink: 0,
                      "& .MuiSwitch-thumb": { bgcolor: checked ? "#F5AD27" : undefined },
                      "& .MuiSwitch-track": { bgcolor: checked ? "rgba(245,173,39,0.4) !important" : undefined },
                    }}
                  />
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, flex: 1 }}>
                    <Box sx={{ mt: "2px", flexShrink: 0 }}>{icon}</Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{label}</Typography>
                      <Typography variant="body2" color="text.secondary">{description}</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Section>
        </Grid>
      </Grid>

      {/* ── Floating save button ── */}
      <Box sx={{ position: "fixed", bottom: 28, right: 28, zIndex: 1200, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
        {mutation.isError && (
          <Typography variant="caption" color="error" sx={{ bgcolor: "background.paper", px: 1.5, py: 0.5, borderRadius: 2, boxShadow: 2 }}>
            Error al guardar. Intentá de nuevo.
          </Typography>
        )}
        <Button
          variant="contained"
          size="large"
          startIcon={
            mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />
          }
          disabled={mutation.isPending}
          onClick={handleSave}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 4, boxShadow: 4 }}
        >
          {mutation.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </Box>

    </Box>
  );
}
