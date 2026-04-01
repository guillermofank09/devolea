import { useEffect, useState } from "react";
import {
  Box,
  Button,
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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMatch } from "../../api/tournamentService";
import type { Pair, TournamentMatch } from "../../types/Tournament";

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

function toLocalDatetimeValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditMatchDialog({ open, onClose, match, pairs, tournamentId }: Props) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [pair1Id, setPair1Id] = useState<number | "">("");
  const [pair2Id, setPair2Id] = useState<number | "">("");
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setScheduledAt(toLocalDatetimeValue(match.scheduledAt));
      setPair1Id(match.pair1?.id ?? "");
      setPair2Id(match.pair2?.id ?? "");
      setWinnerId(match.winnerId ?? null);
      setResult(match.result ?? "");
      setError(null);
    }
  }, [open, match]);

  const mutation = useMutation({
    mutationFn: () => {
      const status = winnerId ? "COMPLETED" : match.status;
      return updateMatch(match.id, {
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar partido #{match.matchNumber} — Ronda {match.round}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 0.5 }}>
          <FormControl fullWidth>
            <FormLabel htmlFor="match-time">Fecha y hora</FormLabel>
            <OutlinedInput
              id="match-time"
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
            />
          </FormControl>

          <FormControl fullWidth>
            <FormLabel htmlFor="match-pair1">Pareja 1</FormLabel>
            <Select
              id="match-pair1"
              value={pair1Id}
              onChange={e => setPair1Id(e.target.value as number | "")}
              displayEmpty
            >
              <MenuItem value=""><em>Sin pareja</em></MenuItem>
              {pairs.map(p => (
                <MenuItem key={p.id} value={p.id}>{pairLabel(p)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <FormLabel htmlFor="match-pair2">Pareja 2</FormLabel>
            <Select
              id="match-pair2"
              value={pair2Id}
              onChange={e => setPair2Id(e.target.value as number | "")}
              displayEmpty
            >
              <MenuItem value=""><em>Sin pareja</em></MenuItem>
              {pairs.map(p => (
                <MenuItem key={p.id} value={p.id}>{pairLabel(p)}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {showWinner && (
            <FormControl>
              <FormLabel sx={{ mb: 1 }}>Ganador</FormLabel>
              <ToggleButtonGroup
                value={winnerId}
                exclusive
                onChange={(_, val) => setWinnerId(val)}
                size="small"
              >
                <ToggleButton value={currentPair1!.id} sx={{ textTransform: "none", px: 2 }}>
                  {pairLabel(currentPair1!)}
                </ToggleButton>
                <ToggleButton value={currentPair2!.id} sx={{ textTransform: "none", px: 2 }}>
                  {pairLabel(currentPair2!)}
                </ToggleButton>
              </ToggleButtonGroup>
            </FormControl>
          )}

          <FormControl fullWidth>
            <FormLabel htmlFor="match-result">Resultado</FormLabel>
            <OutlinedInput
              id="match-result"
              value={result}
              onChange={e => setResult(e.target.value)}
              placeholder="Ej: 6-3 7-5"
            />
          </FormControl>

          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {mutation.isPending ? <CircularProgress size={18} /> : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
