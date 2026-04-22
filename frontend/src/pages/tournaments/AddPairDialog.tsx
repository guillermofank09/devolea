import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormLabel,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlayers } from "../../api/playerService";
import { addPair } from "../../api/tournamentService";
import { fetchCourts } from "../../api/courtService";
import { fetchBookingsByCourt } from "../../api/bookingService";
import { fetchProfile } from "../../api/profileService";
import { fetchSettings } from "../../api/settingsService";
import type { Player, PlayerCategory } from "../../types/Player";
import type { Pair, TournamentCategory } from "../../types/Tournament";
import type { DaySchedule } from "../../types/ClubProfile";
import type { Booking } from "../../types/Booking";
import AddEditPlayer from "../players/AddEditPlayer";
import { getInitials, stringToColor } from "../../utils/uiUtils";
import { FORM_LABEL_SX } from "../../styles/formStyles";

const CATEGORY_LABEL: Record<PlayerCategory, string> = {
  PRIMERA: "1ra", SEGUNDA: "2da", TERCERA: "3ra", CUARTA: "4ta",
  QUINTA: "5ta", SEXTA: "6ta", SEPTIMA: "7ma", SIN_CATEGORIA: "S/C",
};
const CATEGORY_COLOR: Record<PlayerCategory, "error" | "warning" | "success" | "info" | "primary" | "secondary" | "default"> = {
  PRIMERA: "error", SEGUNDA: "warning", TERCERA: "success", CUARTA: "info",
  QUINTA: "primary", SEXTA: "secondary", SEPTIMA: "default", SIN_CATEGORIA: "default",
};

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const CREATE_OPTION_ID = -1;

interface SlotOption { label: string; datetimeLocal: string; available: boolean; }

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

function isSlotFree(datetimeLocal: string, bookings: Booking[], slotDuration: number): boolean {
  const start = new Date(datetimeLocal);
  const end = new Date(start.getTime() + slotDuration * 60 * 1000);
  return !bookings.some(b => {
    const bStart = new Date(b.startTime);
    const bEnd = new Date(b.endTime);
    return bStart < end && bEnd > start;
  });
}

function addDays(dateStr: string, days: number): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const date = new Date(y, mo - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
}

type Option = Player | { id: typeof CREATE_OPTION_ID; name: string };

function PlayerSelector({
  label, players, isFetching, value, onChange, disabledIds, onCreatePlayer, sport,
}: {
  label: string; players: Player[]; isFetching: boolean;
  value: Player | null; onChange: (p: Player | null) => void;
  disabledIds: number[]; onCreatePlayer: (name: string) => void;
  sport?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue(value?.name ?? "");
  }, [value]);
  const filtered = useMemo(
    () => inputValue.trim() ? players.filter(p => p.name.toLowerCase().includes(inputValue.toLowerCase())) : players,
    [players, inputValue]
  );
  const showCreate = inputValue.trim().length > 0 && !players.some(p => p.name.toLowerCase() === inputValue.toLowerCase());
  const options: Option[] = [...filtered, ...(showCreate ? [{ id: CREATE_OPTION_ID as typeof CREATE_OPTION_ID, name: inputValue.trim() }] : [])];

  return (
    <Autocomplete<Option>
      options={options}
      getOptionLabel={opt => opt.id === CREATE_OPTION_ID ? `Agregar "${opt.name}"` : (opt as Player).name}
      filterOptions={x => x}
      value={value}
      inputValue={inputValue}
      onInputChange={(_, val) => setInputValue(val)}
      onChange={(_, val) => {
        if (!val) { onChange(null); return; }
        if (val.id === CREATE_OPTION_ID) { onCreatePlayer(val.name); }
        else { onChange(val as Player); }
      }}
      getOptionDisabled={opt => opt.id !== CREATE_OPTION_ID && disabledIds.includes(opt.id)}
      loading={isFetching}
      noOptionsText="No se encontraron jugadores"
      renderInput={params => (
        <TextField
          {...params}
          label={label || undefined}
          placeholder="Buscar por nombre..."
          size="small"
          InputProps={{
            ...params.InputProps,
            endAdornment: <>{isFetching && <CircularProgress size={16} />}{params.InputProps.endAdornment}</>,
          }}
        />
      )}
      renderOption={(props, option) => {
        const { key, ...rest } = props as any;
        if (option.id === CREATE_OPTION_ID) {
          return (
            <li key="create" {...rest}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "primary.main", fontWeight: 600 }}>
                <PersonAddIcon fontSize="small" />
                <Typography variant="body2" fontWeight={600}>Agregar "{option.name}" como nuevo jugador</Typography>
              </Box>
            </li>
          );
        }
        const p = option as Player;
        return (
          <li key={p.id} {...rest}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
              <Avatar sx={{ width: 32, height: 32, fontSize: "0.75rem", fontWeight: 700, bgcolor: stringToColor(p.name), flexShrink: 0 }}>
                {getInitials(p.name)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>{p.name}</Typography>
                <Typography variant="caption" color="text.secondary">{p.city}</Typography>
              </Box>
              {(() => { const cat = sport === "TENIS" ? (p.tenisCategory ?? p.category) : p.category; return <Chip label={CATEGORY_LABEL[cat]} color={CATEGORY_COLOR[cat]} size="small" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />; })()}
            </Box>
          </li>
        );
      }}
    />
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  tournamentId: number;
  existingPairs: Pair[];
  tournamentCategory: TournamentCategory;
  tournamentStartDate: string;
  sport?: string;
}

export default function AddPairDialog({
  open, onClose, tournamentId, existingPairs, tournamentCategory, tournamentStartDate, sport,
}: Props) {
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [p1Paid, setP1Paid] = useState(false);
  const [p2Paid, setP2Paid] = useState(false);
  const [selectedDate, setSelectedDate] = useState(tournamentStartDate);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);
  const [creatingForSlot, setCreatingForSlot] = useState<1 | 2>(1);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const date1 = tournamentStartDate;
  const date2 = useMemo(() => addDays(tournamentStartDate, 1), [tournamentStartDate]);

  useEffect(() => {
    if (open) {
      setPlayer1(null);
      setPlayer2(null);
      setP1Paid(false);
      setP2Paid(false);
      setSelectedDate(tournamentStartDate);
      setSelectedTimes([]);
      setError(null);
    }
  }, [open, tournamentStartDate]);

  const { data: players = [], isFetching } = useQuery<Player[]>({
    queryKey: ["playersData"],
    queryFn: () => fetchPlayers(),
    enabled: open,
  });

  const { data: settings } = useQuery({ queryKey: ["appSettings"], queryFn: fetchSettings, enabled: open });
  const matchDuration = settings?.tournamentMatchDuration ?? 60;

  const { data: courts = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["courtsData"],
    queryFn: () => fetchCourts(),
    enabled: open,
  });

  const { data: profile } = useQuery({
    queryKey: ["clubProfile"],
    queryFn: fetchProfile,
    enabled: open,
  });

  const courtBookingResults = useQueries({
    queries: courts.map(c => ({
      queryKey: ["bookingsByCourt", c.id],
      queryFn: () => fetchBookingsByCourt(c.id),
      enabled: open && courts.length > 0,
    })),
  });

  const slots: SlotOption[] = useMemo(() => {
    if (!selectedDate || !profile?.businessHours) return [];
    const base = getBaseSlots(selectedDate, profile.businessHours, matchDuration);
    return base.map(slot => {
      const available = courts.length === 0 || courts.some((_, idx) => {
        const bookings: Booking[] = courtBookingResults[idx]?.data ?? [];
        return isSlotFree(slot.datetimeLocal, bookings, matchDuration);
      });
      return { ...slot, available };
    });
  }, [selectedDate, profile, matchDuration, courts, courtBookingResults]);

  const sportFiltered = sport
    ? players.filter(p => {
        const playerSports = p.sports?.length ? p.sports : (p.sport ? [p.sport] : []);
        return playerSports.includes(sport);
      })
    : players;
  const usedInTournament = existingPairs.flatMap(p => [p.player1.id, ...(p.player2 ? [p.player2.id] : [])]);
  const disabledForP1 = [...usedInTournament, ...(player2 ? [player2.id] : [])];
  const disabledForP2 = [...usedInTournament, ...(player1 ? [player1.id] : [])];

  const categoryWarnings = useMemo<string[]>(() => {
    if (tournamentCategory === "SIN_CATEGORIA") return [];
    const warnings: string[] = [];
    for (const p of [player1, player2]) {
      if (!p) continue;
      const playerCat = sport === "TENIS" ? (p.tenisCategory ?? p.category) : p.category;
      if (playerCat !== tournamentCategory) {
        warnings.push(`${p.name} está en categoría ${CATEGORY_LABEL[playerCat as PlayerCategory]}, distinta a la del torneo (${CATEGORY_LABEL[tournamentCategory as PlayerCategory]}).`);
      }
    }
    return warnings;
  }, [player1, player2, tournamentCategory, sport]);

  const mutation = useMutation({
    mutationFn: () => addPair(tournamentId, player1!.id, player2!.id, {
      player1InscriptionPaid: p1Paid,
      player2InscriptionPaid: p2Paid,
      preferredStartTimes: selectedTimes.length ? selectedTimes : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", String(tournamentId)] });
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error ?? "Error al agregar la pareja");
    },
  });

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleCreatePlayer = (slot: 1 | 2, _name: string) => {
    setCreatingForSlot(slot);
    setCreatePlayerOpen(true);
  };

  const handlePlayerCreated = (newPlayer: Player) => {
    queryClient.invalidateQueries({ queryKey: ["playersData"] });
    if (creatingForSlot === 1) { setPlayer1(newPlayer); }
    else { setPlayer2(newPlayer); }
    setCreatePlayerOpen(false);
  };

  const isValid = player1 && player2 && player1.id !== player2.id;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Agregar pareja</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>

            {/* Jugador 1 */}
            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                Jugador 1
              </Typography>
              <Box sx={{ mt: 1, mb: 1.5 }}>
                <PlayerSelector
                  label=""
                  players={sportFiltered}
                  isFetching={isFetching}
                  value={player1}
                  onChange={p => { setPlayer1(p); setError(null); }}
                  disabledIds={disabledForP1}
                  onCreatePlayer={name => handleCreatePlayer(1, name)}
                  sport={sport}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Inscripción abonada</Typography>
                <Switch size="small" checked={p1Paid} onChange={(_, v) => setP1Paid(v)} color="success" />
              </Box>
            </Box>

            {/* Jugador 2 */}
            <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 2 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                Jugador 2
              </Typography>
              <Box sx={{ mt: 1, mb: 1.5 }}>
                <PlayerSelector
                  label=""
                  players={sportFiltered}
                  isFetching={isFetching}
                  value={player2}
                  onChange={p => { setPlayer2(p); setError(null); }}
                  disabledIds={disabledForP2}
                  onCreatePlayer={name => handleCreatePlayer(2, name)}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">Inscripción abonada</Typography>
                <Switch size="small" checked={p2Paid} onChange={(_, v) => setP2Paid(v)} color="success" />
              </Box>
            </Box>

            {categoryWarnings.length > 0 && (
              <Alert severity="warning" sx={{ fontSize: "0.82rem" }}>
                {categoryWarnings.map((w, i) => <div key={i}>{w}</div>)}
              </Alert>
            )}

            <Divider />

            {/* Horario sugerido para primer partido */}
            <Box>
              <FormLabel sx={{ ...FORM_LABEL_SX, display: "block", mb: 1 }}>
                Horario sugerido para primer partido
              </FormLabel>

              <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                {[date1, date2].map((d, i) => (
                  <Chip
                    key={d}
                    label={`Día ${i + 1} · ${formatDateLabel(d)}`}
                    onClick={() => setSelectedDate(d)}
                    color={selectedDate === d ? "primary" : "default"}
                    variant={selectedDate === d ? "filled" : "outlined"}
                    size="small"
                    sx={{ cursor: "pointer" }}
                  />
                ))}
              </Box>

              {slots.length > 0 ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {slots.map(slot => {
                    const isSelected = selectedTimes.includes(slot.datetimeLocal);
                    return (
                      <Chip
                        key={slot.datetimeLocal}
                        label={slot.label}
                        size="small"
                        onClick={() => {
                          if (!slot.available) return;
                          setSelectedTimes(prev =>
                            isSelected ? prev.filter(t => t !== slot.datetimeLocal) : [...prev, slot.datetimeLocal]
                          );
                        }}
                        color={isSelected ? "primary" : "default"}
                        variant={isSelected ? "filled" : "outlined"}
                        disabled={!slot.available}
                        sx={{ cursor: slot.available ? "pointer" : "default", fontSize: "0.75rem" }}
                      />
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {profile ? "No hay horarios disponibles para ese día." : "Cargando horarios…"}
                </Typography>
              )}

              {selectedTimes.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "block", mb: 0.75 }}>
                    Horarios seleccionados ({selectedTimes.length}):
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {[...selectedTimes].sort().map(t => {
                      const [date, time] = t.split("T");
                      return (
                        <Chip
                          key={t}
                          label={`${time} · ${formatDateLabel(date)}`}
                          size="small"
                          color="success"
                          onDelete={() => setSelectedTimes(prev => prev.filter(x => x !== t))}
                          sx={{ fontSize: "0.72rem" }}
                        />
                      );
                    })}
                    <Chip
                      label="Limpiar todo"
                      size="small"
                      variant="outlined"
                      onClick={() => setSelectedTimes([])}
                      sx={{ fontSize: "0.72rem", cursor: "pointer" }}
                    />
                  </Box>
                </Box>
              )}
            </Box>

            {error && <Typography variant="body2" color="error">{error}</Typography>}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
          <Button onClick={handleClose} fullWidth={fullScreen} sx={{ textTransform: "none" }}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!isValid || mutation.isPending}
            onClick={() => mutation.mutate()}
            fullWidth={fullScreen}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {mutation.isPending ? <CircularProgress size={18} /> : "Agregar pareja"}
          </Button>
        </DialogActions>
      </Dialog>

      <AddEditPlayer
        open={createPlayerOpen}
        onClose={() => setCreatePlayerOpen(false)}
        onCreated={handlePlayerCreated}
      />
    </>
  );
}
