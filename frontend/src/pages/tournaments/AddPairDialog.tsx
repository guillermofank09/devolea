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
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlayers } from "../../api/playerService";
import { addPair } from "../../api/tournamentService";
import type { Player, PlayerCategory } from "../../types/Player";
import type { Pair } from "../../types/Tournament";
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
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

const CREATE_OPTION_ID = -1;

interface Props {
  open: boolean;
  onClose: () => void;
  tournamentId: number;
  existingPairs: Pair[];
}

type Option = Player | { id: typeof CREATE_OPTION_ID; name: string };

function PlayerSelector({
  label,
  players,
  isFetching,
  value,
  onChange,
  disabledIds,
  onCreatePlayer,
}: {
  label: string;
  players: Player[];
  isFetching: boolean;
  value: Player | null;
  onChange: (p: Player | null) => void;
  disabledIds: number[];
  onCreatePlayer: (name: string) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  const filtered = useMemo(
    () =>
      inputValue.trim()
        ? players.filter(p => p.name.toLowerCase().includes(inputValue.toLowerCase()))
        : players,
    [players, inputValue]
  );

  const showCreate =
    inputValue.trim().length > 0 &&
    !players.some(p => p.name.toLowerCase() === inputValue.toLowerCase());

  const options: Option[] = [
    ...filtered,
    ...(showCreate ? [{ id: CREATE_OPTION_ID as typeof CREATE_OPTION_ID, name: inputValue.trim() }] : []),
  ];

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
        if (val.id === CREATE_OPTION_ID) {
          onCreatePlayer(val.name);
        } else {
          onChange(val as Player);
        }
      }}
      getOptionDisabled={opt => opt.id !== CREATE_OPTION_ID && disabledIds.includes(opt.id)}
      loading={isFetching}
      noOptionsText="No se encontraron jugadores"
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          placeholder="Buscar por nombre..."
          size="small"
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
  );
}

export default function AddPairDialog({ open, onClose, tournamentId, existingPairs }: Props) {
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);
  const [creatingForSlot, setCreatingForSlot] = useState<1 | 2>(1);
  const [_createPlayerName, setCreatePlayerName] = useState("");

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const { data: players = [], isFetching } = useQuery<Player[]>({
    queryKey: ["playersData"],
    queryFn: () => fetchPlayers(),
    enabled: open,
  });

  const usedInTournament = existingPairs.flatMap(p => [p.player1.id, p.player2.id]);

  const mutation = useMutation({
    mutationFn: () => addPair(tournamentId, player1!.id, player2!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", String(tournamentId)] });
      handleClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error ?? "Error al agregar la pareja");
    },
  });

  const handleClose = () => {
    setPlayer1(null);
    setPlayer2(null);
    setError(null);
    onClose();
  };

  const handleCreatePlayer = (slot: 1 | 2, name: string) => {
    setCreatingForSlot(slot);
    setCreatePlayerName(name);
    setCreatePlayerOpen(true);
  };

  const handlePlayerCreated = (newPlayer: Player) => {
    queryClient.invalidateQueries({ queryKey: ["playersData"] });
    if (creatingForSlot === 1) setPlayer1(newPlayer);
    else setPlayer2(newPlayer);
  };

  const disabledForP1 = [...usedInTournament, ...(player2 ? [player2.id] : [])];
  const disabledForP2 = [...usedInTournament, ...(player1 ? [player1.id] : [])];

  const isValid = player1 && player2 && player1.id !== player2.id;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}>
        <DialogTitle>Agregar pareja</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 0.5 }}>
            <PlayerSelector
              label="Jugador 1"
              players={players}
              isFetching={isFetching}
              value={player1}
              onChange={p => { setPlayer1(p); setError(null); }}
              disabledIds={disabledForP1}
              onCreatePlayer={name => handleCreatePlayer(1, name)}
            />
            <PlayerSelector
              label="Jugador 2"
              players={players}
              isFetching={isFetching}
              value={player2}
              onChange={p => { setPlayer2(p); setError(null); }}
              disabledIds={disabledForP2}
              onCreatePlayer={name => handleCreatePlayer(2, name)}
            />
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
