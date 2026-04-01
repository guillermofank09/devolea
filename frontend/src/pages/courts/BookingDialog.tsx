import { useState, useMemo } from "react";
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
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RepeatIcon from "@mui/icons-material/Repeat";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlayers } from "../../api/playerService";
import { createBooking } from "../../api/bookingService";
import type { Player, PlayerCategory } from "../../types/Player";
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
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: players = [], isFetching } = useQuery<Player[]>({
    queryKey: ["playersData"],
    queryFn: () => fetchPlayers(),
    enabled: open,
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
    setInputValue("");
    setIsRecurring(false);
    setBookingError(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedPlayer || !slot) return;
    setBookingError(null);
    bookMutation.mutate({
      courtId,
      playerId: selectedPlayer.id,
      startTime: slot.start.toISOString(),
      endTime: slot.end.toISOString(),
      isRecurring,
    });
  };

  const handlePlayerCreated = (newPlayer: Player) => {
    queryClient.invalidateQueries({ queryKey: ["playersData"] });
    setSelectedPlayer(newPlayer);
    setInputValue(newPlayer.name);
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Reservar turno</DialogTitle>

        <DialogContent>
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
          <Autocomplete<Player | { id: typeof CREATE_OPTION_ID; name: string }>
            options={options}
            getOptionLabel={(opt) =>
              opt.id === CREATE_OPTION_ID ? `Agregar "${opt.name}"` : (opt as Player).name
            }
            filterOptions={(x) => x} // filtering done manually above
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
            loading={isFetching}
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
                      {isFetching && <CircularProgress size={16} />}
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
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        color: "primary.main",
                        fontWeight: 600,
                      }}
                    >
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
                    <Avatar
                      sx={{
                        width: 32, height: 32, fontSize: "0.75rem",
                        fontWeight: 700, bgcolor: stringToColor(p.name), flexShrink: 0,
                      }}
                    >
                      {getInitials(p.name)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {p.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.city}
                      </Typography>
                    </Box>
                    <Chip
                      label={CATEGORY_LABEL[p.category]}
                      color={CATEGORY_COLOR[p.category]}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                    />
                  </Box>
                </li>
              );
            }}
          />

          {/* Selected player preview */}
          {selectedPlayer && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                  sx={{
                    bgcolor: stringToColor(selectedPlayer.name),
                    width: 40, height: 40, fontWeight: 700,
                  }}
                >
                  {getInitials(selectedPlayer.name)}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={700}>
                    {selectedPlayer.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedPlayer.city} · Cat. {CATEGORY_LABEL[selectedPlayer.category]}
                  </Typography>
                </Box>
              </Box>
            </>
          )}

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

        <DialogActions>
          <Button onClick={handleClose} sx={{ textTransform: "none" }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!selectedPlayer || bookMutation.isPending}
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
