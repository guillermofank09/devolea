import { useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  MenuItem,
  Select,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEquipos } from "../../api/equipoService";
import { addTeam } from "../../api/tournamentService";
import type { TournamentTeam } from "../../types/Tournament";
import type { Equipo } from "../../types/Equipo";
import { getInitials, stringToColor } from "../../utils/uiUtils";
import { FORM_LABEL_SX } from "../../styles/formStyles";
import PageLoader from "../../components/common/PageLoader";

interface Props {
  open: boolean;
  onClose: () => void;
  tournamentId: number;
  existingTeams: TournamentTeam[];
  sport?: string;
}

export default function AddTeamDialog({ open, onClose, tournamentId, existingTeams, sport }: Props) {
  const [equipoId, setEquipoId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const { data: equipos = [], isPending } = useQuery<Equipo[]>({
    queryKey: ["equiposData"],
    queryFn: () => fetchEquipos(),
    enabled: open,
  });

  const existingIds = new Set(existingTeams.map(t => t.equipo.id));
  const available = equipos.filter(e => {
    if (existingIds.has(e.id)) return false;
    if (!sport) return true;
    return e.sport === sport;
  });

  const mutation = useMutation({
    mutationFn: () => addTeam(tournamentId, Number(equipoId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", String(tournamentId)] });
      setEquipoId("");
      setError(null);
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error ?? "Error al agregar el equipo");
    },
  });

  const handleClose = () => { setEquipoId(""); setError(null); onClose(); };

  const selected = equipos.find(e => e.id === equipoId);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Agregar equipo</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box>
            <FormLabel sx={FORM_LABEL_SX}>Equipo</FormLabel>
            {isPending ? (
              <PageLoader size={20} />
            ) : available.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay equipos disponibles para agregar.
              </Typography>
            ) : (
              <Select
                fullWidth
                size="small"
                value={equipoId}
                onChange={e => setEquipoId(e.target.value as number | "")}
                displayEmpty
                sx={{ height: 40, fontSize: "0.875rem" }}
                renderValue={(val) => {
                  if (!val) return <em style={{ color: "#aaa" }}>Seleccioná un equipo</em>;
                  const eq = equipos.find(e => e.id === val);
                  return eq?.name ?? String(val);
                }}
              >
                {available.map(e => (
                  <MenuItem key={e.id} value={e.id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        src={e.avatarUrl}
                        sx={{ width: 28, height: 28, fontSize: "0.65rem", bgcolor: stringToColor(e.name) }}
                      >
                        {!e.avatarUrl && getInitials(e.name)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{e.name}</Typography>
                        {e.city && <Typography variant="caption" color="text.secondary">{e.city}</Typography>}
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            )}
          </Box>

          {selected && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
              <Avatar
                src={selected.avatarUrl}
                sx={{ width: 36, height: 36, fontSize: "0.75rem", bgcolor: stringToColor(selected.name) }}
              >
                {!selected.avatarUrl && getInitials(selected.name)}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={700}>{selected.name}</Typography>
                {selected.city && <Typography variant="caption" color="text.secondary">{selected.city}</Typography>}
              </Box>
            </Box>
          )}

          {error && <Typography variant="body2" color="error">{error}</Typography>}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
        <Button
          onClick={handleClose}
          fullWidth={fullScreen}
          sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!equipoId || mutation.isPending}
          onClick={() => mutation.mutate()}
          fullWidth={fullScreen}
          startIcon={mutation.isPending ? <PageLoader size={14} /> : undefined}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          {mutation.isPending ? "Agregando…" : "Agregar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
