import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateMatches } from "../../api/tournamentService";
import { fetchCourts } from "../../api/courtService";
import { fetchBookingsByCourt } from "../../api/bookingService";
import { fetchProfile } from "../../api/profileService";
import { fetchSettings } from "../../api/settingsService";
import type { DaySchedule } from "../../types/ClubProfile";
import type { Booking } from "../../types/Booking";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface SlotOption {
  label: string;
  datetimeLocal: string;
  available: boolean;
}

function generateSlots(date: string, hours: DaySchedule[], bookings: Booking[], slotDuration: number): SlotOption[] {
  const [y, mo, d] = date.split("-").map(Number);
  const dayOfWeek = new Date(y, mo - 1, d).getDay();
  const daySchedule = hours.find(h => h.day === DAY_NAMES[dayOfWeek]);
  if (!daySchedule?.isOpen) return [];

  const [openH, openM] = daySchedule.openTime.split(":").map(Number);
  const [closeH, closeM] = daySchedule.closeTime.split(":").map(Number);
  const closeMinutes = closeH * 60 + closeM;

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);
  const dayBookings = bookings.filter(b => {
    const t = new Date(b.startTime);
    return t >= dayStart && t <= dayEnd;
  });

  const slots: SlotOption[] = [];
  let slotStart = openH * 60 + openM;
  while (slotStart + slotDuration <= closeMinutes) {
    const h = Math.floor(slotStart / 60);
    const m = slotStart % 60;
    const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const datetimeLocal = `${date}T${label}`;
    const start = new Date(datetimeLocal);
    const end = new Date(start.getTime() + slotDuration * 60 * 1000);
    const available = !dayBookings.some(b => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return bStart < end && bEnd > start;
    });
    slots.push({ label, datetimeLocal, available });
    slotStart += slotDuration;
  }
  return slots;
}

interface Props {
  open: boolean;
  onClose: () => void;
  pairCount: number;
  tournamentId: number;
  onGenerated: () => void;
}

export default function GenerateMatchesDialog({ open, onClose, pairCount, tournamentId, onGenerated }: Props) {
  const [date, setDate] = useState("");
  const [courtId, setCourtId] = useState<number | "">("");
  const [startTime, setStartTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const format = pairCount <= 4 ? "Round Robin" : "Llaves (Bracket)";
  const formatDesc =
    pairCount <= 4
      ? `Con ${pairCount} parejas se jugará un torneo de todos contra todos (${(pairCount * (pairCount - 1)) / 2} partidos).`
      : `Con ${pairCount} parejas se jugará un torneo de eliminación directa. Los cruces de ronda 1 se generan ahora.`;

  const { data: settings } = useQuery({
    queryKey: ["appSettings"],
    queryFn: fetchSettings,
    enabled: open,
  });

  const matchDuration = settings?.tournamentMatchDuration ?? 60;

  const { data: courts = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["courtsData"],
    queryFn: () => fetchCourts(),
    enabled: open,
  });

  const { data: profile } = useQuery({
    queryKey: ["clubProfile"],
    queryFn: fetchProfile,
    enabled: open && !!date,
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["bookingsByCourt", courtId],
    queryFn: () => fetchBookingsByCourt(Number(courtId)),
    enabled: open && !!courtId && !!date,
  });

  const slots: SlotOption[] =
    date && profile?.businessHours
      ? generateSlots(date, profile.businessHours, courtId ? bookings : [], matchDuration)
      : [];

  const mutation = useMutation({
    mutationFn: () =>
      generateMatches(
        tournamentId,
        new Date(startTime).toISOString(),
        courtId !== "" ? Number(courtId) : null,
        matchDuration,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", String(tournamentId)] });
      onGenerated();
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error ?? "Error al generar los cruces");
    },
  });

  const handleClose = () => {
    setDate("");
    setCourtId("");
    setStartTime("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}>
      <DialogTitle>Generar cruces</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
          <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: "grey.100" }}>
            <Typography variant="body2" fontWeight={700} mb={0.5}>
              Formato: {format}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDesc}
            </Typography>
          </Box>

          <FormControl fullWidth>
            <FormLabel htmlFor="generate-date">Fecha</FormLabel>
            <OutlinedInput
              id="generate-date"
              type="date"
              value={date}
              onChange={e => {
                setDate(e.target.value);
                setStartTime("");
                setError(null);
              }}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel htmlFor="generate-court">Cancha</FormLabel>
            <Select
              id="generate-court"
              value={courtId}
              onChange={e => {
                setCourtId(e.target.value as number | "");
                setStartTime("");
              }}
              displayEmpty
            >
              <MenuItem value=""><em>Sin cancha asignada</em></MenuItem>
              {courts.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {date && slots.length > 0 && (
            <FormControl>
              <FormLabel sx={{ mb: 1 }}>
                Horario de inicio
                {!!courtId && (
                  <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                    (deshabilitado = ocupado)
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
          disabled={!startTime || mutation.isPending}
          onClick={() => mutation.mutate()}
          fullWidth={fullScreen}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {mutation.isPending ? <CircularProgress size={18} /> : "Generar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
