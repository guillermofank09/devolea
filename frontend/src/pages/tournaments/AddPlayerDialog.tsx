import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPlayers } from "../../api/playerService";
import { addPair } from "../../api/tournamentService";
import type { Player } from "../../types/Player";
import type { Pair } from "../../types/Tournament";
import AddEditPlayer from "../players/AddEditPlayer";
import { getInitials, stringToColor } from "../../utils/uiUtils";
import PageLoader from "../../components/common/PageLoader";

const CREATE_OPTION_ID = -1;
type Option = Player | { id: typeof CREATE_OPTION_ID; name: string };

interface Props {
  open: boolean;
  onClose: () => void;
  tournamentId: number;
  existingPairs: Pair[];
  sport?: string;
}

export default function AddPlayerDialog({ open, onClose, tournamentId, existingPairs, sport }: Props) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [createPlayerOpen, setCreatePlayerOpen] = useState(false);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setPlayer(null);
      setPaid(false);
      setError(null);
      setInputValue("");
    }
  }, [open]);

  const { data: players = [], isFetching } = useQuery<Player[]>({
    queryKey: ["playersData"],
    queryFn: () => fetchPlayers(),
    enabled: open,
  });

  const usedIds = existingPairs.map(p => p.player1.id);
  const sportFiltered = sport
    ? players.filter(p => {
        const playerSports = p.sports?.length ? p.sports : (p.sport ? [p.sport] : []);
        return playerSports.includes(sport);
      })
    : players;
  const filtered = inputValue.trim()
    ? sportFiltered.filter(p => p.name.toLowerCase().includes(inputValue.toLowerCase()))
    : sportFiltered;
  const showCreate = inputValue.trim().length > 0 && !players.some(p => p.name.toLowerCase() === inputValue.toLowerCase());
  const options: Option[] = [...filtered, ...(showCreate ? [{ id: CREATE_OPTION_ID as typeof CREATE_OPTION_ID, name: inputValue.trim() }] : [])];

  const mutation = useMutation({
    mutationFn: () => addPair(tournamentId, player!.id, null, {
      player1InscriptionPaid: paid,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", String(tournamentId)] });
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error ?? "Error al agregar el jugador");
    },
  });

  const handleClose = () => { setError(null); onClose(); };

  const handlePlayerCreated = (newPlayer: Player) => {
    queryClient.invalidateQueries({ queryKey: ["playersData"] });
    setPlayer(newPlayer);
    setCreatePlayerOpen(false);
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Agregar jugador</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Autocomplete<Option>
              options={options}
              getOptionLabel={opt => opt.id === CREATE_OPTION_ID ? `Agregar "${opt.name}"` : (opt as Player).name}
              filterOptions={x => x}
              value={player}
              inputValue={inputValue}
              onInputChange={(_, val) => setInputValue(val)}
              onChange={(_, val) => {
                if (!val) { setPlayer(null); return; }
                if (val.id === CREATE_OPTION_ID) { setCreatePlayerOpen(true); }
                else { setPlayer(val as Player); setError(null); }
              }}
              getOptionDisabled={opt => opt.id !== CREATE_OPTION_ID && usedIds.includes(opt.id)}
              loading={isFetching}
              noOptionsText="No se encontraron jugadores"
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder="Buscar por nombre..."
                  size="small"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: <>{isFetching && <PageLoader size={16} />}{params.InputProps.endAdornment}</>,
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
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: "0.75rem", fontWeight: 700, bgcolor: stringToColor(p.name) }}>
                        {getInitials(p.name)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                        {p.city && <Typography variant="caption" color="text.secondary">{p.city}</Typography>}
                      </Box>
                    </Box>
                  </li>
                );
              }}
            />
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">Inscripción abonada</Typography>
              <Switch size="small" checked={paid} onChange={(_, v) => setPaid(v)} color="success" />
            </Box>
            {error && <Typography variant="body2" color="error">{error}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
          <Button onClick={handleClose} fullWidth={fullScreen} sx={{ textTransform: "none" }}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!player || mutation.isPending}
            onClick={() => mutation.mutate()}
            fullWidth={fullScreen}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {mutation.isPending ? <PageLoader size={18} /> : "Agregar jugador"}
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
