import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import PageLoader from "../../components/common/PageLoader";
import { es } from "date-fns/locale";
import { format, parseISO } from "date-fns";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateMatches, setTournamentFormat } from "../../api/tournamentService";
import { fetchCourts } from "../../api/courtService";
import type { Court } from "../../types/Court";
import { fetchBookingsByCourt } from "../../api/bookingService";
import { useAuth } from "../../context/AuthContext";
import { fetchProfile } from "../../api/profileService";
import { fetchSettings } from "../../api/settingsService";
import type { DaySchedule } from "../../types/ClubProfile";
import type { Booking } from "../../types/Booking";
import { FORM_LABEL_SX } from "../../styles/formStyles";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface SlotOption {
  label: string;
  datetimeLocal: string;
  available: boolean;
}

function getBaseSlots(date: string, hours: DaySchedule[], slotDuration: number): SlotOption[] {
  const [y, mo, d] = date.split("-").map(Number);
  const dayOfWeek = new Date(y, mo - 1, d).getDay();
  const daySchedule = hours.find(h => h.day === DAY_NAMES[dayOfWeek]);
  if (!daySchedule?.isOpen) return [];

  const [openH, openM] = daySchedule.openTime.split(":").map(Number);
  const [closeH, closeM] = daySchedule.closeTime.split(":").map(Number);
  const closeMinutes = closeH * 60 + closeM;

  const slots: SlotOption[] = [];
  let slotStart = openH * 60 + openM;
  while (slotStart + slotDuration <= closeMinutes) {
    const h = Math.floor(slotStart / 60);
    const m = slotStart % 60;
    const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    slots.push({ label, datetimeLocal: `${date}T${label}`, available: true });
    slotStart += slotDuration;
  }
  return slots;
}

function isSlotFreeForCourt(datetimeLocal: string, bookings: Booking[], slotDuration: number): boolean {
  const start = new Date(datetimeLocal);
  const end = new Date(start.getTime() + slotDuration * 60 * 1000);
  return !bookings.some(b => {
    const bStart = new Date(b.startTime);
    const bEnd = new Date(b.endTime);
    return bStart < end && bEnd > start;
  });
}

interface Props {
  open: boolean;
  onClose: () => void;
  pairCount: number;
  tournamentId: number;
  tournamentStartDate: string;
  onGenerated: () => void;
  teamMode?: boolean;
  tennisMode?: boolean;
  sport?: string;
}

export default function GenerateMatchesDialog({ open, onClose, pairCount, tournamentId, tournamentStartDate, onGenerated, teamMode = false, tennisMode = false, sport }: Props) {
  const { user } = useAuth();
  const multipleSports = (user?.sports ?? []).length > 1;
  const [date, setDate] = useState(tournamentStartDate ?? "");
  const [courtIds, setCourtIds] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<"BRACKET" | "ROUND_ROBIN" | "PERSONALIZADO">("BRACKET");
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setDate(tournamentStartDate ?? "");
      setCourtIds([]);
      setStartTime("");
      setError(null);
      setSelectedFormat("BRACKET");
    }
  }, [open, tournamentStartDate]);

  const unit = teamMode ? "equipos" : tennisMode ? "jugadores" : "parejas";
  const formatDesc =
    selectedFormat === "ROUND_ROBIN"
      ? `Con ${pairCount} ${unit} se jugará un torneo de todos contra todos (${(pairCount * (pairCount - 1)) / 2} partidos en total).`
      : selectedFormat === "PERSONALIZADO"
      ? "Armá el torneo a medida: agregá fases y partidos manualmente. Ideal para formatos especiales, cuadros personalizados o eventos con estructura propia."
      : `Con ${pairCount} ${unit} se jugarán 2 rondas garantizadas: primero los cruces iniciales (Ronda 1) y luego los ganadores enfrentan a los perdedores de los otros grupos (Cruces). Después continúa la eliminación directa.`;

  const { data: settings } = useQuery({
    queryKey: ["appSettings"],
    queryFn: fetchSettings,
    enabled: open,
  });

  const matchDuration = settings?.tournamentMatchDuration ?? 60;

  const { data: allCourts = [] } = useQuery<Court[]>({
    queryKey: ["courtsData"],
    queryFn: () => fetchCourts(),
    enabled: open,
  });

  const courts = sport && multipleSports
    ? allCourts.filter(c => {
        if (sport.startsWith("FUTBOL")) return c.sport === "FUTBOL" && c.type === sport;
        return c.sport === sport;
      })
    : allCourts;

  const { data: profile } = useQuery({
    queryKey: ["clubProfile"],
    queryFn: fetchProfile,
    enabled: open && !!date,
  });

  const courtBookingResults = useQueries({
    queries: courts.map(c => ({
      queryKey: ["bookingsByCourt", c.id],
      queryFn: () => fetchBookingsByCourt(c.id),
      enabled: open && !!date && courts.length > 0,
    })),
  });

  // Per-court availability (has any free slot on that day)
  const courtAvailability = useMemo<Record<number, boolean>>(() => {
    if (!date || !profile?.businessHours) return {};
    return Object.fromEntries(
      courts.map((court, idx) => {
        const bookings: Booking[] = courtBookingResults[idx]?.data ?? [];
        const base = getBaseSlots(date, profile.businessHours!, matchDuration);
        return [court.id, base.some(s => isSlotFreeForCourt(s.datetimeLocal, bookings, matchDuration))];
      })
    );
  }, [courts, courtBookingResults, date, profile, matchDuration]);

  // Slots available if at least one selected court is free at that time
  const slots: SlotOption[] = useMemo(() => {
    if (!date || !profile?.businessHours) return [];
    const base = getBaseSlots(date, profile.businessHours, matchDuration);
    if (courtIds.length === 0) return base;
    return base.map(slot => {
      const available = courtIds.some(cId => {
        const idx = courts.findIndex(c => c.id === cId);
        const bookings: Booking[] = idx >= 0 ? (courtBookingResults[idx]?.data ?? []) : [];
        return isSlotFreeForCourt(slot.datetimeLocal, bookings, matchDuration);
      });
      return { ...slot, available };
    });
  }, [courtIds, courts, courtBookingResults, date, profile, matchDuration]);

  const toggleCourt = (id: number) => {
    setCourtIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setStartTime("");
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (selectedFormat === "PERSONALIZADO") {
        await setTournamentFormat(tournamentId, "PERSONALIZADO");
      } else {
        await generateMatches(
          tournamentId,
          startTime ? new Date(startTime).toISOString() : undefined,
          courtIds.length > 0 ? courtIds : undefined,
          matchDuration,
          selectedFormat,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", String(tournamentId)] });
      onGenerated();
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error ?? "Error al configurar el torneo");
    },
  });

  const handleClose = () => {
    setDate(tournamentStartDate ?? "");
    setCourtIds([]);
    setStartTime("");
    setError(null);
    setSelectedFormat("BRACKET");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{selectedFormat === "PERSONALIZADO" ? "Torneo personalizado" : "Generar cruces"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
          <Box>
            <FormLabel sx={FORM_LABEL_SX}>Formato</FormLabel>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
              {(["BRACKET", "ROUND_ROBIN", "PERSONALIZADO"] as const).map(fmt => {
                const labels: Record<string, string> = { BRACKET: "Llaves", ROUND_ROBIN: "Todos contra todos", PERSONALIZADO: "Personalizado" };
                const selected = selectedFormat === fmt;
                return (
                  <Chip
                    key={fmt}
                    label={labels[fmt]}
                    onClick={() => setSelectedFormat(fmt)}
                    variant={selected ? "filled" : "outlined"}
                    sx={{
                      fontWeight: 600, fontSize: "0.78rem", cursor: "pointer",
                      ...(selected
                        ? { bgcolor: "#f5ad27", color: "#fff", borderColor: "#f5ad27", "&:hover": { bgcolor: "#e09b1a" } }
                        : { borderColor: "divider" }),
                    }}
                  />
                );
              })}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatDesc}
            </Typography>
          </Box>

          <>
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Fecha</FormLabel>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    value={date ? parseISO(date) : null}
                    onChange={d => {
                      setDate(d ? format(d, "yyyy-MM-dd") : "");
                      setStartTime("");
                      setError(null);
                    }}
                    slotProps={{
                      textField: { fullWidth: true, size: "small", sx: { fontSize: "0.875rem" } },
                    }}
                  />
                </LocalizationProvider>
              </Box>

              <Box>
                <FormLabel sx={FORM_LABEL_SX}>
                  Canchas
                  {date && Object.keys(courtAvailability).length > 0 && (
                    <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                      (verde = disponible ese día)
                    </Typography>
                  )}
                </FormLabel>
                {courts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No hay canchas registradas.</Typography>
                ) : (
                  <FormGroup>
                    {courts.map(court => {
                      const available = courtAvailability[court.id];
                      return (
                        <FormControlLabel
                          key={court.id}
                          control={
                            <Checkbox
                              checked={courtIds.includes(court.id)}
                              onChange={() => toggleCourt(court.id)}
                              size="small"
                            />
                          }
                          label={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              {date && Object.keys(courtAvailability).length > 0 && (
                                <FiberManualRecordIcon
                                  sx={{ fontSize: 10, color: available ? "success.main" : "text.disabled" }}
                                />
                              )}
                              <Typography variant="body2">{court.name}</Typography>
                            </Box>
                          }
                          sx={{ ml: 0 }}
                        />
                      );
                    })}
                  </FormGroup>
                )}
              </Box>

              {date && slots.length > 0 && (
                <FormControl>
                  <FormLabel sx={{ mb: 1 }}>
                    Horario de inicio
                    {courtIds.length > 0 && (
                      <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                        (deshabilitado = todas las canchas ocupadas)
                      </Typography>
                    )}
                  </FormLabel>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {slots.map(slot => (
                      <Chip
                        key={slot.label}
                        label={slot.label}
                        onClick={() => { if (slot.available) setStartTime(slot.datetimeLocal); }}
                        color={startTime === slot.datetimeLocal ? "primary" : "default"}
                        variant={startTime === slot.datetimeLocal ? "filled" : "outlined"}
                        disabled={!slot.available}
                        sx={{ cursor: slot.available ? "pointer" : "default" }}
                      />
                    ))}
                  </Box>
                </FormControl>
              )}

              {date && slots.length === 0 && profile && (
                <Typography variant="body2" color="text.secondary">
                  No hay horarios disponibles para ese día.
                </Typography>
              )}

              {!startTime && (
                <Typography variant="body2" color="text.secondary" sx={{ bgcolor: "grey.50", borderRadius: 2, p: 1.5, fontSize: "0.82rem" }}>
                  Sin horario seleccionado, los cruces se generarán sin cancha ni horario asignados. Podés editarlos después desde cada partido.
                </Typography>
              )}
          </>

          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
        <Button onClick={handleClose} fullWidth={fullScreen} sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          fullWidth={fullScreen}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {mutation.isPending ? <PageLoader size={18} /> : selectedFormat === "PERSONALIZADO" ? "Confirmar" : "Generar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
