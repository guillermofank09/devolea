import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateMatch } from "../../api/tournamentService";
import { fetchCourts } from "../../api/courtService";
import { fetchBookingsByCourt } from "../../api/bookingService";
import { fetchProfile } from "../../api/profileService";
import { fetchSettings } from "../../api/settingsService";
import type { Pair, TournamentMatch } from "../../types/Tournament";
import type { DaySchedule } from "../../types/ClubProfile";
import type { Booking } from "../../types/Booking";

const labelSx = { mb: 0.5, fontSize: "0.8rem", fontWeight: 600, color: "text.secondary" };
const fieldSx = { "& .MuiInputBase-root": { height: 40, fontSize: "0.875rem" } };

interface SetScore { p1: string; p2: string; }

function parseResultToSets(result: string | null | undefined, count: number): SetScore[] {
  const parts = (result ?? "").trim().split(/\s+/).filter(Boolean);
  return Array.from({ length: count }, (_, i) => {
    const part = parts[i] ?? "";
    const [p1, p2] = part.split("-");
    return { p1: p1 ?? "", p2: p2 ?? "" };
  });
}

function composeSetsResult(sets: SetScore[]): string {
  return sets
    .filter(s => s.p1 !== "" || s.p2 !== "")
    .map(s => `${s.p1}-${s.p2}`)
    .join(" ");
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface SlotOption {
  label: string;
  datetimeLocal: string;
  available: boolean;
}

function generateSlots(date: string, hours: DaySchedule[], bookings: Booking[], currentScheduledAt: string): SlotOption[] {
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

  const currentStart = currentScheduledAt ? new Date(currentScheduledAt) : null;

  const slots: SlotOption[] = [];
  let slotStart = openH * 60 + openM;
  while (slotStart + 90 <= closeMinutes) {
    const h = Math.floor(slotStart / 60);
    const m = slotStart % 60;
    const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const datetimeLocal = `${date}T${label}`;
    const start = new Date(datetimeLocal);
    const end = new Date(start.getTime() + 90 * 60 * 1000);

    const isCurrentSlot = currentStart && Math.abs(start.getTime() - currentStart.getTime()) < 60 * 1000;
    const available = isCurrentSlot || !dayBookings.some(b => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return bStart < end && bEnd > start;
    });
    slots.push({ label, datetimeLocal, available });
    slotStart += 90;
  }
  return slots;
}

interface Props {
  open: boolean;
  onClose: () => void;
  match: TournamentMatch;
  pairs: Pair[];
  tournamentId: number;
}

function pairLabel(pair: Pair) {
  return `${pair.player1.name} / ${pair.player2.name}`;
}

function pairInitials(pair: Pair): string {
  const initials = (name: string) =>
    name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? "").join("");
  return `${initials(pair.player1.name)} / ${initials(pair.player2.name)}`;
}

function calcWinnerFromSets(sets: SetScore[], p1Id: number | "", p2Id: number | ""): number | null {
  if (!p1Id || !p2Id) return null;
  const p1Wins = sets.filter(s => s.p1 !== "" && s.p2 !== "" && Number(s.p1) > Number(s.p2)).length;
  const p2Wins = sets.filter(s => s.p1 !== "" && s.p2 !== "" && Number(s.p2) > Number(s.p1)).length;
  if (p1Wins > p2Wins) return Number(p1Id);
  if (p2Wins > p1Wins) return Number(p2Id);
  return null;
}

function toLocalDatetimeParts(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export default function EditMatchDialog({ open, onClose, match, pairs, tournamentId }: Props) {
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [courtId, setCourtId] = useState<number | "">("");
  const [pair1Id, setPair1Id] = useState<number | "">("");
  const [pair2Id, setPair2Id] = useState<number | "">("");
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [sets, setSets] = useState<SetScore[]>([{ p1: "", p2: "" }, { p1: "", p2: "" }, { p1: "", p2: "" }]);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["appSettings"],
    queryFn: fetchSettings,
    enabled: open,
  });

  const setsCount = settings?.tournamentSetsCount ?? 3;

  const scheduledAt = scheduleDate && scheduleTime ? `${scheduleDate}T${scheduleTime}` : "";

  useEffect(() => {
    if (open) {
      const parts = toLocalDatetimeParts(match.scheduledAt);
      setScheduleDate(parts.date);
      setScheduleTime(parts.time);
      setCourtId(match.court?.id ?? "");
      setPair1Id(match.pair1?.id ?? "");
      setPair2Id(match.pair2?.id ?? "");
      setWinnerId(match.winnerId ?? null);
      setSets(parseResultToSets(match.result, setsCount));
      setError(null);
    }
  }, [open, match, setsCount]);


  const { data: courts = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["courtsData"],
    queryFn: () => fetchCourts(),
    enabled: open,
  });

  const { data: profile } = useQuery({
    queryKey: ["clubProfile"],
    queryFn: fetchProfile,
    enabled: open && !!scheduleDate && !!courtId,
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["bookingsByCourt", courtId],
    queryFn: () => fetchBookingsByCourt(Number(courtId)),
    enabled: open && !!courtId && !!scheduleDate,
  });

  const slots: SlotOption[] =
    scheduleDate && courtId && profile?.businessHours
      ? generateSlots(scheduleDate, profile.businessHours, bookings, scheduledAt)
      : [];

  const mutation = useMutation({
    mutationFn: () => {
      const status = winnerId ? "COMPLETED" : match.status;
      const result = composeSetsResult(sets);
      return updateMatch(match.id, {
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        courtId: courtId !== "" ? Number(courtId) : null,
        pair1Id: pair1Id !== "" ? Number(pair1Id) : null,
        pair2Id: pair2Id !== "" ? Number(pair2Id) : null,
        winnerId: winnerId ?? null,
        result: result || undefined,
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", String(tournamentId)] });
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error ?? "Error al actualizar el partido");
    },
  });

  const currentPair1 = pairs.find(p => p.id === Number(pair1Id)) ?? match.pair1;
  const currentPair2 = pairs.find(p => p.id === Number(pair2Id)) ?? match.pair2;
  const showWinner = !!currentPair1 && !!currentPair2;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        Editar partido #{match.matchNumber} — Ronda {match.round}
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

          <Box>
            <FormLabel sx={labelSx}>Cancha</FormLabel>
            <Select
              fullWidth
              size="small"
              value={courtId}
              onChange={e => setCourtId(e.target.value as number | "")}
              displayEmpty
              sx={{ height: 40, fontSize: "0.875rem" }}
            >
              <MenuItem value=""><em>Sin cancha asignada</em></MenuItem>
              {courts.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <FormLabel sx={labelSx}>Fecha y hora</FormLabel>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                type="date"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                sx={{ ...fieldSx, flex: 1 }}
              />
              <TextField
                size="small"
                type="time"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                sx={{ ...fieldSx, minWidth: 110, flexShrink: 0 }}
              />
            </Box>
          </Box>

          {slots.length > 0 && (
            <Box>
              <FormLabel sx={{ ...labelSx, display: "block", mb: 1 }}>
                Turnos disponibles
                <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                  (deshabilitado = ocupado)
                </Typography>
              </FormLabel>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {slots.map(slot => (
                  <Chip
                    key={slot.label}
                    label={slot.label}
                    onClick={() => { if (slot.available) setScheduleTime(slot.label); }}
                    color={scheduleTime === slot.label ? "primary" : "default"}
                    variant={scheduleTime === slot.label ? "filled" : "outlined"}
                    disabled={!slot.available}
                    sx={{ cursor: slot.available ? "pointer" : "default" }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Box>
            <FormLabel sx={labelSx}>Pareja 1</FormLabel>
            <Select
              fullWidth
              size="small"
              value={pair1Id}
              onChange={e => setPair1Id(e.target.value as number | "")}
              displayEmpty
              sx={{ height: 40, fontSize: "0.875rem" }}
            >
              <MenuItem value=""><em>Sin pareja</em></MenuItem>
              {pairs.map(p => (
                <MenuItem key={p.id} value={p.id}>{pairLabel(p)}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <FormLabel sx={labelSx}>Pareja 2</FormLabel>
            <Select
              fullWidth
              size="small"
              value={pair2Id}
              onChange={e => setPair2Id(e.target.value as number | "")}
              displayEmpty
              sx={{ height: 40, fontSize: "0.875rem" }}
            >
              <MenuItem value=""><em>Sin pareja</em></MenuItem>
              {pairs.map(p => (
                <MenuItem key={p.id} value={p.id}>{pairLabel(p)}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box>
            <FormLabel sx={{ ...labelSx, display: "block", mb: 1 }}>Resultado por set</FormLabel>
            {currentPair1 && currentPair2 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                <Typography variant="caption" sx={{ minWidth: 44 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ width: 56, textAlign: "center", fontSize: "0.7rem", flexShrink: 0 }}>
                  {pairInitials(currentPair1)}
                </Typography>
                <Box sx={{ width: 12 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ width: 56, textAlign: "center", fontSize: "0.7rem", flexShrink: 0 }}>
                  {pairInitials(currentPair2)}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {Array.from({ length: setsCount }, (_, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ minWidth: 44 }}>
                    Set {i + 1}
                  </Typography>
                  <TextField
                    size="small"
                    value={sets[i]?.p1 ?? ""}
                    onChange={e => {
                      const next = sets.map((s, idx) => idx === i ? { ...s, p1: e.target.value } : s);
                      setSets(next);
                      setWinnerId(calcWinnerFromSets(next, pair1Id, pair2Id));
                    }}
                    placeholder="0"
                    inputProps={{ style: { textAlign: "center", padding: "6px 8px" } }}
                    sx={{ width: 56, flexShrink: 0 }}
                  />
                  <Typography variant="body2" color="text.secondary">—</Typography>
                  <TextField
                    size="small"
                    value={sets[i]?.p2 ?? ""}
                    onChange={e => {
                      const next = sets.map((s, idx) => idx === i ? { ...s, p2: e.target.value } : s);
                      setSets(next);
                      setWinnerId(calcWinnerFromSets(next, pair1Id, pair2Id));
                    }}
                    placeholder="0"
                    inputProps={{ style: { textAlign: "center", padding: "6px 8px" } }}
                    sx={{ width: 56, flexShrink: 0 }}
                  />
                </Box>
              ))}
            </Box>
          </Box>

          {showWinner && (
            <Box>
              <FormLabel sx={{ ...labelSx, display: "block", mb: 1 }}>Ganador</FormLabel>
              <ToggleButtonGroup
                value={winnerId}
                exclusive
                onChange={(_, val) => setWinnerId(val)}
                size="small"
                fullWidth
                sx={{
                  height: 40,
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    borderColor: "divider",
                    color: "text.secondary",
                  },
                  "& .MuiToggleButton-root.Mui-selected": {
                    bgcolor: "#F5AD27",
                    color: "#111",
                    borderColor: "#F5AD27",
                    "&:hover": { bgcolor: "#e09b18" },
                  },
                }}
              >
                <ToggleButton value={currentPair1!.id}>
                  {pairLabel(currentPair1!)}
                </ToggleButton>
                <ToggleButton value={currentPair2!.id}>
                  {pairLabel(currentPair2!)}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}

        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
        <Button onClick={onClose} fullWidth={fullScreen} sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          fullWidth={fullScreen}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          {mutation.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
