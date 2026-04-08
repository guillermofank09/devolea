import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
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
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTournamentById, removePair, triggerNextRound } from "../../api/tournamentService";
import type { Pair, TournamentDetail as TournamentDetailType, TournamentMatch, TournamentStatus } from "../../types/Tournament";
import PageHeader from "../../components/common/PageHeader";
import AddPairDialog from "./AddPairDialog";
import GenerateMatchesDialog from "./GenerateMatchesDialog";
import EditMatchDialog from "./EditMatchDialog";
import DeleteDialog from "../../components/common/DeleteDialog";
import BracketView from "./BracketView";
import { stringToColor } from "../../utils/uiUtils";
import EmptyState from "../../components/common/EmptyState";
import { FORM_LABEL_SX } from "../../styles/formStyles";

const STATUS_LABEL: Record<TournamentStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Activo",
  COMPLETED: "Finalizado",
};

const STATUS_COLOR: Record<TournamentStatus, "default" | "success" | "primary"> = {
  DRAFT: "default",
  ACTIVE: "success",
  COMPLETED: "primary",
};

function pairInitials(pair: Pair) {
  return `${pair.player1.name.split(" ")[0][0]}${pair.player2.name.split(" ")[0][0]}`.toUpperCase();
}

function pairLabel(pair: Pair | null | undefined): string {
  if (!pair) return "BYE";
  return `${pair.player1.name} / ${pair.player2.name}`;
}

function formatScheduledAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function MatchStatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: "default" | "warning" | "success" | "info" }> = {
    PENDING: { label: "Pendiente", color: "warning" },
    COMPLETED: { label: "Completado", color: "success" },
    BYE: { label: "BYE", color: "info" },
  };
  const cfg = map[status] ?? { label: status, color: "default" };
  return <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 600, fontSize: "0.7rem" }} />;
}

function NextRoundDialog({
  open,
  onClose,
  tournamentId,
}: {
  open: boolean;
  onClose: () => void;
  tournamentId: number;
}) {
  const [startDate, setStartDate] = useState("");
  const [startTimeVal, setStartTimeVal] = useState("");
  const startTime = startDate && startTimeVal ? `${startDate}T${startTimeVal}` : "";
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => triggerNextRound(tournamentId, new Date(startTime).toISOString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", String(tournamentId)] });
      setStartDate("");
      setStartTimeVal("");
      setError(null);
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error ?? "Error al generar la siguiente ronda");
    },
  });

  const handleClose = () => {
    setStartDate("");
    setStartTimeVal("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}>
      <DialogTitle>Siguiente ronda</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
          <Box>
            <FormLabel sx={FORM_LABEL_SX}>
              Fecha y hora de inicio
            </FormLabel>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                type="date"
                fullWidth
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setError(null); }}
              />
              <TextField
                size="small"
                type="time"
                value={startTimeVal}
                onChange={e => { setStartTimeVal(e.target.value); setError(null); }}
                sx={{ minWidth: 110, flexShrink: 0 }}
              />
            </Box>
          </Box>
          {error && <Typography variant="body2" color="error">{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
        <Button onClick={handleClose} fullWidth={fullScreen} sx={{ textTransform: "none" }}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={!startTime || mutation.isPending}
          onClick={() => mutation.mutate()}
          fullWidth={fullScreen}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {mutation.isPending ? <CircularProgress size={18} /> : "Generar ronda"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [addPairOpen, setAddPairOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [nextRoundOpen, setNextRoundOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<TournamentMatch | null>(null);
  const [deletePairTarget, setDeletePairTarget] = useState<Pair | null>(null);

  const { isPending, error, data } = useQuery<TournamentDetailType>({
    queryKey: ["tournamentDetail", id],
    queryFn: () => fetchTournamentById(Number(id)),
    enabled: !!id,
  });

  const removePairMutation = useMutation({
    mutationFn: (pairId: number) => removePair(Number(id), pairId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", id] });
      setDeletePairTarget(null);
    },
  });

  if (isPending) {
    return (
      <Box display="flex" justifyContent="center" py={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return <Alert severity="error">{error ? String(error) : "Torneo no encontrado"}</Alert>;
  }

  const hasMatches = data.matches.length > 0;
  const isBracket = data.format === "BRACKET";

  // Check if all matches in current max round are done
  const maxRound = hasMatches ? Math.max(...data.matches.map(m => m.round)) : 0;
  const currentRoundMatches = data.matches.filter(m => m.round === maxRound);
  const currentRoundDone = currentRoundMatches.length > 0 && currentRoundMatches.every(m => m.status !== "PENDING");
  const canNextRound = isBracket && currentRoundDone && currentRoundMatches.filter(m => m.status !== "BYE").length > 0;

  // Group matches by round for bracket
  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/tournaments")}
          sx={{ textTransform: "none", color: "text.secondary" }}
        >
          Torneos
        </Button>
      </Box>

      <PageHeader
        title={data.name}
        subtitle={`${data.startDate} → ${data.endDate}`}
        action={
          <Chip
            label={STATUS_LABEL[data.status]}
            color={STATUS_COLOR[data.status]}
            sx={{ fontWeight: 700 }}
          />
        }
      />

      <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" }, alignItems: "flex-start" }}>
        {/* Parejas */}
        <Box sx={{ width: { xs: "100%", md: 300 }, flexShrink: 0, minWidth: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography variant="h6" fontWeight={700}>
              Parejas ({data.pairs.length})
            </Typography>
            {!hasMatches && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setAddPairOpen(true)}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
              >
                Agregar pareja
              </Button>
            )}
          </Box>

          {data.pairs.length === 0 ? (
            <EmptyState message="No hay parejas registradas. Agregá la primera." />
          ) : (
            <List dense sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 0, overflow: "hidden" }}>
              {data.pairs.map((pair, idx) => (
                <Box key={pair.id}>
                  {idx > 0 && <Divider />}
                  <ListItem
                    secondaryAction={
                      !hasMatches ? (
                        <Tooltip title="Eliminar pareja">
                          <IconButton
                            edge="end"
                            size="small"
                            color="error"
                            onClick={() => setDeletePairTarget(pair)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          width: 36, height: 36, fontSize: "0.75rem", fontWeight: 700,
                          bgcolor: stringToColor(pair.player1.name + pair.player2.name),
                        }}
                      >
                        {pairInitials(pair)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600}>
                          {pair.player1.name}
                        </Typography>
                      }
                      secondary={pair.player2.name}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          )}
        </Box>

        {/* Partidos */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography variant="h6" fontWeight={700}>
              Partidos
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {!hasMatches && data.pairs.length >= 2 && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setGenerateOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
                >
                  Generar cruces
                </Button>
              )}
              {canNextRound && (
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  onClick={() => setNextRoundOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
                >
                  Siguiente ronda
                </Button>
              )}
            </Box>
          </Box>

          {!hasMatches && (
            <Typography variant="body2" color="text.secondary">
              {data.pairs.length < 2
                ? "Agregá al menos 2 parejas para generar los cruces."
                : "Los cruces aún no fueron generados."}
            </Typography>
          )}

          {hasMatches && !isBracket && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {data.matches.map(m => (
                <MatchCard
                  key={m.id}
                  match={m}
                  onEdit={() => setEditMatch(m)}
                />
              ))}
            </Box>
          )}

          {hasMatches && isBracket && (
            <BracketView
              matches={data.matches}
              onEditMatch={m => setEditMatch(m)}
            />
          )}
        </Box>
      </Box>

      <AddPairDialog
        open={addPairOpen}
        onClose={() => setAddPairOpen(false)}
        tournamentId={Number(id)}
        existingPairs={data.pairs}
      />

      <GenerateMatchesDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        pairCount={data.pairs.length}
        tournamentId={Number(id)}
        onGenerated={() => {}}
      />

      <NextRoundDialog
        open={nextRoundOpen}
        onClose={() => setNextRoundOpen(false)}
        tournamentId={Number(id)}
      />

      {editMatch && (
        <EditMatchDialog
          open={!!editMatch}
          onClose={() => setEditMatch(null)}
          match={editMatch}
          pairs={data.pairs}
          tournamentId={Number(id)}
        />
      )}

      <DeleteDialog
        open={!!deletePairTarget}
        title="Eliminar pareja"
        description="¿Estás seguro de que querés eliminar esta pareja del torneo? Esta acción no se puede deshacer."
        loading={removePairMutation.isPending}
        onClose={() => setDeletePairTarget(null)}
        onConfirm={() => deletePairTarget && removePairMutation.mutate(deletePairTarget.id)}
      />
    </Box>
  );
}

function MatchCard({ match, onEdit }: { match: TournamentMatch; onEdit: () => void }) {
  const winnerPair = match.winnerId
    ? (match.pair1?.id === match.winnerId ? match.pair1 : match.pair2)
    : null;

  return (
    <Box
      sx={{
        p: 1.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        backgroundColor: match.status === "COMPLETED" ? "grey.50" : "background.paper",
      }}
    >
      {/* Row 1: names + status + edit */}
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <Typography variant="body2" fontWeight={600} sx={{ flex: 1, minWidth: 0, wordBreak: "break-word", lineHeight: 1.4 }}>
          {pairLabel(match.pair1)}{" "}
          <span style={{ color: "#aaa", fontWeight: 400 }}>vs</span>{" "}
          {pairLabel(match.pair2)}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0, mt: "1px" }}>
          <MatchStatusChip status={match.status} />
          <Tooltip title="Editar partido">
            <IconButton size="small" onClick={onEdit} sx={{ ml: 0.5 }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      {/* Row 2: schedule + court + result + winner */}
      <Box sx={{ display: "flex", gap: 1, mt: 0.75, flexWrap: "wrap", alignItems: "center" }}>
        <Typography variant="caption" color="text.secondary">
          {formatScheduledAt(match.scheduledAt)}
        </Typography>
        {match.court && (
          <Typography variant="caption" color="text.secondary">
            · {match.court.name}
          </Typography>
        )}
        {match.result && (
          <Typography variant="caption" fontWeight={700} color="text.primary">
            · {match.result}
          </Typography>
        )}
        {winnerPair && (
          <Typography variant="caption" color="success.main" fontWeight={700}>
            · Ganador: {pairLabel(winnerPair)}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
