import { useState, useMemo, useEffect } from "react";
import {
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
  FormControlLabel,
  InputAdornment,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RepeatIcon from "@mui/icons-material/Repeat";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlayers } from "../../api/playerService";
import { fetchProfesores } from "../../api/profesorService";
import { createBooking } from "../../api/bookingService";
import { fetchSettings } from "../../api/settingsService";
import type { Player, PlayerCategory } from "../../types/Player";
import type { Profesor } from "../../types/Profesor";
import type { AppSettings } from "../../types/AppSettings";
import AddEditPlayer from "../players/AddEditPlayer";

const CATEGORY_LABEL: Record<PlayerCategory, string> = {
  PRIMERA: "1ra", SEGUNDA: "2da", TERCERA: "3ra", CUARTA: "4ta",
  QUINTA: "5ta", SEXTA: "6ta", SEPTIMA: "7ma",
};

const CATEGORY_COLOR: Record<PlayerCategory, "error" | "warning" | "success" | "info" | "primary" | "secondary" | "default"> = {
  PRIMERA: "error", SEGUNDA: "warning", TERCERA: "success", CUARTA: "info",
  QUINTA: "primary", SEXTA: "secondary", SEPTIMA: "default",
};

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 45%, 40%)`;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const formatDate = (d: Date) =>
  d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const formatTime = (d: Date) =>
  d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

// Special sentinel used to trigger "create player" from the Autocomplete
const CREATE_OPTION_ID = -1;

interface SlotInfo { start: Date; end: Date }

interface Props {
  open: boolean;
  onClose: () => void;
  slot: SlotInfo | null;
  courtId: number;
  onBooked: () => void;
}

export default function BookingDialog({ open, onClose, slot, courtId, onBooked }: Props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [bookingType, setBookingType] = useState<"player" | "profesor">("player");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedProfesor, setSelectedProfesor] = useState<Profesor | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [price, setPrice] = useState<string>("");

  const queryClient = useQueryClient();

  const { data: settings } = useQuery<AppSettings>({
    queryKey: ["appSettings"],
    queryFn: fetchSettings,
    staleTime: 30_000,
  });

  // Auto-fill price when slot or booking type changes
  useEffect(() => {
    if (!slot || !settings) { setPrice(""); return; }
    const hrs = (slot.end.getTime() - slot.start.getTime()) / 3_600_000;
    const rate = bookingType === "profesor" ? Number(settings.classHourlyRate) : Number(settings.hourlyRate);
    const computed = hrs * rate;
    setPrice(computed > 0 ? String(computed) : "");
  }, [slot, bookingType, settings]);

  const { data: players = [], isFetching: fetchingPlayers } = useQuery<Player[]>({
    queryKey: ["playersData"],
    queryFn: () => fetchPlayers(),
    enabled: open && bookingType === "player",
  });

  const { data: profesores = [], isFetching: fetchingProfesores } = useQuery<Profesor[]>({
    queryKey: ["profesoresData"],
    queryFn: () => fetchProfesores(),
    enabled: open && bookingType === "profesor",
  });

  // Filter locally by what the user typed
  const filteredPlayers = useMemo(
    () =>
      inputValue.trim()
        ? players.filter((p) =>
            p.name.toLowerCase().includes(inputValue.toLowerCase())
          )
        : players,
    [players, inputValue]
  );

  // Append the "create" pseudo-option when there's text and no exact match
  const showCreateOption =
    inputValue.trim().length > 0 &&
    !players.some((p) => p.name.toLowerCase() === inputValue.toLowerCase());

  const options: (Player | { id: typeof CREATE_OPTION_ID; name: string })[] = [
    ...filteredPlayers,
    ...(showCreateOption
      ? [{ id: CREATE_OPTION_ID as typeof CREATE_OPTION_ID, name: inputValue.trim() }]
      : []),
  ];

  const bookMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookingsData", courtId] });
      queryClient.invalidateQueries({ queryKey: ["courtsData"] });
      handleClose();
      onBooked();
    },
    onError: (err: any) => {
      setBookingError(err?.response?.data?.error ?? "Error al crear la reserva");
    },
  });

  const handleClose = () => {
    setSelectedPlayer(null);
    setSelectedProfesor(null);
    setInputValue("");
    setIsRecurring(false);
    setBookingError(null);
    setBookingType("player");
    setPrice("");
    onClose();
  };

  const handleSubmit = () => {
    if (!slot) return;
    if (bookingType === "player" && !selectedPlayer) return;
    if (bookingType === "profesor" && !selectedProfesor) return;
    setBookingError(null);
    bookMutation.mutate({
      courtId,
      playerId: bookingType === "player" ? selectedPlayer!.id : undefined,
      profesorId: bookingType === "profesor" ? selectedProfesor!.id : undefined,
      startTime: slot.start.toISOString(),
      endTime: slot.end.toISOString(),
      isRecurring,
      price: price !== "" ? Number(price) : undefined,
    });
  };

  const handlePlayerCreated = (newPlayer: Player) => {
    queryClient.invalidateQueries({ queryKey: ["playersData"] });
    setSelectedPlayer(newPlayer);
    setInputValue(newPlayer.name);
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>Reservar turno</DialogTitle>

        <DialogContent>
          {/* Booking type toggle */}
          <ToggleButtonGroup
            value={bookingType}
            exclusive
            onChange={(_, val) => {
              if (!val) return;
              setBookingType(val);
              setSelectedPlayer(null);
              setSelectedProfesor(null);
              setInputValue("");
            }}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="player" sx={{ textTransform: "none", fontWeight: 600, gap: 0.75 }}>
              <PersonIcon fontSize="small" /> Jugador
            </ToggleButton>
            <ToggleButton value="profesor" sx={{ textTransform: "none", fontWeight: 600, gap: 0.75 }}>
              <SchoolIcon fontSize="small" /> Clase (Profesor)
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Date/time summary */}
          {slot && (
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                mb: 3,
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "grey.100",
              }}
            >
              <AccessTimeIcon fontSize="small" color="action" sx={{ mt: 0.2 }} />
              <Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ textTransform: "capitalize" }}
                >
                  {formatDate(slot.start)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatTime(slot.start)} – {formatTime(slot.end)}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Player autocomplete */}
          {bookingType === "player" && (
            <>
              <Autocomplete<Player | { id: typeof CREATE_OPTION_ID; name: string }>
                options={options}
                getOptionLabel={(opt) =>
                  opt.id === CREATE_OPTION_ID ? `Agregar "${opt.name}"` : (opt as Player).name
                }
                filterOptions={(x) => x}
                value={selectedPlayer}
                inputValue={inputValue}
                onInputChange={(_, val) => setInputValue(val)}
                onChange={(_, val) => {
                  if (!val) { setSelectedPlayer(null); return; }
                  if (val.id === CREATE_OPTION_ID) {
                    setCreatePlayerOpen(true);
                  } else {
                    setSelectedPlayer(val as Player);
                  }
                }}
                loading={fetchingPlayers}
                noOptionsText="No se encontraron jugadores"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Jugador"
                    placeholder="Buscar por nombre..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {fetchingPlayers && <CircularProgress size={16} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
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
                          <Typography variant="body2" fontWeight={600}>
                            Agregar "{option.name}" como nuevo jugador
                          </Typography>
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
                        <Chip label={CATEGORY_LABEL[p.category]} color={CATEGORY_COLOR[p.category]} size="small" sx={{ fontWeight: 700, fontSize: "0.7rem" }} />
                      </Box>
                    </li>
                  );
                }}
              />
              {selectedPlayer && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: stringToColor(selectedPlayer.name), width: 40, height: 40, fontWeight: 700 }}>
                      {getInitials(selectedPlayer.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{selectedPlayer.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {selectedPlayer.city} · Cat. {CATEGORY_LABEL[selectedPlayer.category]}
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </>
          )}

          {/* Profesor autocomplete */}
          {bookingType === "profesor" && (
            <>
              <Autocomplete<Profesor>
                options={profesores}
                getOptionLabel={(p) => p.name}
                value={selectedProfesor}
                inputValue={inputValue}
                onInputChange={(_, val) => setInputValue(val)}
                onChange={(_, val) => setSelectedProfesor(val)}
                loading={fetchingProfesores}
                noOptionsText="No se encontraron profesores"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Profesor"
                    placeholder="Buscar por nombre..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {fetchingProfesores && <CircularProgress size={16} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, p) => {
                  const { key, ...rest } = props as any;
                  return (
                    <li key={p.id} {...rest}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: "0.75rem", fontWeight: 700, bgcolor: stringToColor(p.name), flexShrink: 0 }}>
                          {getInitials(p.name)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>{p.name}</Typography>
                          {p.phone && <Typography variant="caption" color="text.secondary">{p.phone}</Typography>}
                        </Box>
                      </Box>
                    </li>
                  );
                }}
              />
              {selectedProfesor && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: stringToColor(selectedProfesor.name), width: 40, height: 40, fontWeight: 700 }}>
                      {getInitials(selectedProfesor.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{selectedProfesor.name}</Typography>
                      {selectedProfesor.phone && (
                        <Typography variant="caption" color="text.secondary">{selectedProfesor.phone}</Typography>
                      )}
                    </Box>
                  </Box>
                </>
              )}
            </>
          )}

          {/* Price field */}
          <Box sx={{ mt: 2.5 }}>
            <TextField
              label="Precio"
              type="text"
              inputMode="decimal"
              size="small"
              fullWidth
              value={price}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
                  setPrice(raw.replace(/^0+(\d)/, "$1"));
                }
              }}
              placeholder="0"
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
              }}
              helperText="Precio total del turno (editable)"
            />
          </Box>

          {/* Recurring toggle */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mt: 2.5,
              p: 1.5,
              borderRadius: 2,
              border: "1.5px solid",
              borderColor: isRecurring ? "primary.main" : "divider",
              bgcolor: isRecurring ? "primary.50" : "transparent",
              transition: "all 0.2s",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <RepeatIcon
                fontSize="small"
                sx={{ color: isRecurring ? "primary.main" : "text.disabled" }}
              />
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Reserva fija semanal
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Se repetirá cada semana el mismo día y horario
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Tooltip
                title="Se crearán hasta 52 reservas (1 año). Se omiten semanas con conflictos."
                arrow
              >
                <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.disabled", cursor: "help" }} />
              </Tooltip>
              <FormControlLabel
                control={
                  <Switch
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    size="small"
                    sx={{
                      "& .MuiSwitch-thumb": { bgcolor: isRecurring ? "#F5AD27" : undefined },
                      "& .MuiSwitch-track": { bgcolor: isRecurring ? "rgba(245,173,39,0.4) !important" : undefined },
                    }}
                  />
                }
                label=""
                sx={{ m: 0 }}
              />
            </Box>
          </Box>

          {bookingError && (
            <Typography variant="body2" color="error" mt={2}>
              {bookingError}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
          <Button onClick={handleClose} fullWidth={fullScreen} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={(bookingType === "player" ? !selectedPlayer : !selectedProfesor) || bookMutation.isPending}
            fullWidth={fullScreen}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {bookMutation.isPending ? <CircularProgress size={18} /> : "Confirmar reserva"}
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
