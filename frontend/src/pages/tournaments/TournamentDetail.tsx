import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTournamentById, removePair, removeTeam, resetMatches, triggerRepechage } from "../../api/tournamentService";
import type { Pair, TournamentDetail as TournamentDetailType, TournamentMatch, TournamentTeam } from "../../types/Tournament";
import PageHeader from "../../components/common/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import AddPairDialog from "./AddPairDialog";
import AddPlayerDialog from "./AddPlayerDialog";
import EditPairDialog from "./EditPairDialog";
import AddTeamDialog from "./AddTeamDialog";
import { isTeamSport, SPORT_LABELS } from "./AddEditTournament";
import GenerateMatchesDialog from "./GenerateMatchesDialog";
import EditMatchDialog from "./EditMatchDialog";
import DeleteDialog from "../../components/common/DeleteDialog";
import BracketView from "./BracketView";
import { getInitials, stringToColor } from "../../utils/uiUtils";
import EmptyState from "../../components/common/EmptyState";

const SEX_LABEL: Record<string, string> = {
  MASCULINO: "Masculino",
  FEMENINO: "Femenino",
  MIXTO: "Mixto",
};


function getDateStatus(startDate: string, endDate: string): { label: string; color: "default" | "success" | "primary" } {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  if (now < start) return { label: "Diagramado", color: "default" };
  if (now > end) return { label: "Finalizado", color: "primary" };
  return { label: "En Curso", color: "success" };
}

function pairInitials(pair: Pair) {
  const p1 = pair.player1.name.split(" ")[0][0];
  const p2 = pair.player2?.name.split(" ")[0][0] ?? "";
  return (p1 + p2).toUpperCase();
}

function pairLabel(pair: Pair | null | undefined): string {
  if (!pair) return "BYE";
  if (!pair.player2) return pair.player1.name;
  return `${pair.player1.name} / ${pair.player2.name}`;
}

function teamLabel(team: TournamentTeam | null | undefined): string {
  if (!team) return "BYE";
  return team.equipo.name;
}

function matchLabel(match: TournamentMatch): { label1: string; label2: string } {
  if (match.team1 !== undefined || match.team2 !== undefined) {
    return { label1: teamLabel(match.team1), label2: teamLabel(match.team2) };
  }
  return { label1: pairLabel(match.pair1), label2: pairLabel(match.pair2) };
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


export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [addPairOpen, setAddPairOpen] = useState(false);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [editPairTarget, setEditPairTarget] = useState<Pair | null>(null);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [deleteTeamTarget, setDeleteTeamTarget] = useState<TournamentTeam | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
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

  const removeTeamMutation = useMutation({
    mutationFn: (teamId: number) => removeTeam(Number(id), teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", id] });
      setDeleteTeamTarget(null);
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetMatches(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", id] });
      setResetConfirmOpen(false);
      setGenerateOpen(true);
    },
  });


  // Open dialog immediately with a synthetic match; DB record is created on save
  const handleVirtualMatchClick = (round: number, matchNumber: number) => {
    setEditMatch({
      id: -1,
      round,
      matchNumber,
      status: "PENDING",
      pair1: null,
      pair2: null,
      court: null,
      scheduledAt: null,
      winnerId: null,
      result: null,
    } as TournamentMatch);
  };

  if (isPending) return <PageLoader />;

  if (error || !data) {
    return <Alert severity="error">{error ? String(error) : "Torneo no encontrado"}</Alert>;
  }

  debugger

  const hasMatches = data.matches.length > 0;
  const isBracket = data.format === "BRACKET";
  const teamMode = isTeamSport(data.sport);
  const tennisMode = data.sport === "TENIS";

  // Separate repechage from bracket matches
  const bracketMatches = data.matches.filter(m => !m.isRepechage);
  const repechajeMatches = data.matches.filter(m => m.isRepechage);


// Repechage: show trigger button when all round-1 regular matches are done and opponent not yet assigned
  const round1Regular = data.matches.filter(m => m.round === 1 && !m.isRepechage);
  const round1Done = round1Regular.length > 0 && round1Regular.every(m => m.status !== "PENDING");
  const canTriggerRepechaje = isBracket && round1Done && repechajeMatches.some(m => teamMode ? !m.team2 : !m.pair2);

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
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {data.sport && (
              <Chip
                label={SPORT_LABELS[data.sport] ?? data.sport}
                size="small"
                sx={{ fontWeight: 600, bgcolor: "#f0f4ff" }}
              />
            )}
            {data.sex && (
              <Chip
                label={SEX_LABEL[data.sex] ?? data.sex}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            )}
            <Chip
              label={getDateStatus(data.startDate, data.endDate).label}
              color={getDateStatus(data.startDate, data.endDate).color}
              sx={{ fontWeight: 700 }}
            />
          </Box>
        }
      />

      <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" }, alignItems: "flex-start" }}>
        {/* Parejas or Equipos */}
        <Box sx={{ width: { xs: "100%", md: 300 }, flexShrink: 0, minWidth: 0 }}>
          {teamMode ? (
            <>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="h6" fontWeight={700}>
                  Equipos ({(data.teams ?? []).length})
                </Typography>
                {!hasMatches && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddTeamOpen(true)}
                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                  >
                    Agregar equipo
                  </Button>
                )}
              </Box>
              {(data.teams ?? []).length === 0 ? (
                <EmptyState message="No hay equipos registrados. Agregá el primero." />
              ) : (
                <List dense sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 0, overflow: "hidden" }}>
                  {(data.teams ?? []).map((team, idx) => (
                    <Box key={team.id}>
                      {idx > 0 && <Divider />}
                      <ListItem
                        secondaryAction={
                          !hasMatches && (
                            <Tooltip title="Eliminar equipo">
                              <IconButton edge="end" size="small" color="error" onClick={() => setDeleteTeamTarget(team)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )
                        }
                      >
                        <ListItemAvatar>
                          <Avatar
                            src={team.equipo.avatarUrl}
                            sx={{ width: 36, height: 36, fontSize: "0.75rem", fontWeight: 700, bgcolor: stringToColor(team.equipo.name) }}
                          >
                            {!team.equipo.avatarUrl && getInitials(team.equipo.name)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{team.equipo.name}</Typography>}
                          secondary={team.equipo.city && <Typography variant="caption" color="text.secondary">{team.equipo.city}</Typography>}
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </>
          ) : tennisMode ? (
            <>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="h6" fontWeight={700}>
                  Jugadores ({data.pairs.length})
                </Typography>
                {!hasMatches && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddPlayerOpen(true)}
                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
                  >
                    Agregar jugador
                  </Button>
                )}
              </Box>
              {data.pairs.length === 0 ? (
                <EmptyState message="No hay jugadores registrados. Agregá el primero." />
              ) : (
                <List dense sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 0, overflow: "hidden" }}>
                  {data.pairs.map((pair, idx) => (
                    <Box key={pair.id}>
                      {idx > 0 && <Divider />}
                      <ListItem
                        secondaryAction={
                          !hasMatches && (
                            <Tooltip title="Eliminar jugador">
                              <IconButton edge="end" size="small" color="error" onClick={() => setDeletePairTarget(pair)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )
                        }
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ width: 36, height: 36, fontSize: "0.75rem", fontWeight: 700, bgcolor: stringToColor(pair.player1.name) }}>
                            {pairInitials(pair)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                              <Typography variant="body2" fontWeight={600}>{pair.player1.name}</Typography>
                              {pair.player1InscriptionPaid && (
                                <Typography component="span" sx={{ fontSize: "0.8rem", fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>$</Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </>
          ) : (
            <>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Typography variant="h6" fontWeight={700}>
                  Parejas ({data.pairs.length})
                </Typography>
                {!hasMatches && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setAddPairOpen(true)}
                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
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
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <Tooltip title="Editar pareja">
                              <IconButton size="small" onClick={() => setEditPairTarget(pair)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {!hasMatches && (
                              <Tooltip title="Eliminar pareja">
                                <IconButton edge="end" size="small" color="error" onClick={() => setDeletePairTarget(pair)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              width: 36, height: 36, fontSize: "0.75rem", fontWeight: 700,
                              bgcolor: stringToColor(pair.player1.name + (pair.player2?.name ?? "")),
                            }}
                          >
                            {pairInitials(pair)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                              <Typography variant="body2" fontWeight={600}>{pair.player1.name}</Typography>
                              {pair.player1InscriptionPaid && (
                                <Typography component="span" sx={{ fontSize: "0.8rem", fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>$</Typography>
                              )}
                            </Box>
                          }
                          secondary={pair.player2 && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                              <Typography variant="caption" color="text.secondary">{pair.player2.name}</Typography>
                              {pair.player2InscriptionPaid && (
                                <Typography component="span" sx={{ fontSize: "0.8rem", fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>$</Typography>
                              )}
                            </Box>
                          )}
                        />
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </>
          )}
        </Box>

        {/* Partidos */}
        <Box sx={{ flex: 1, minWidth: 0, width: { xs: "100%", md: "auto" } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
            <Typography variant="h6" fontWeight={700}>
              Partidos
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {canTriggerRepechaje && (
                <RepechajeButton tournamentId={Number(id)} />
              )}
              {hasMatches && isBracket && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => setResetConfirmOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5, bgcolor: "#111", "&:hover": { bgcolor: "#333" } }}
                >
                  Regenerar cruces
                </Button>
              )}
            </Box>
          </Box>

          {!hasMatches && (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                {teamMode
                  ? ((data.teams ?? []).length < 2
                    ? "Agregá al menos 2 equipos para generar los cruces."
                    : "Los cruces aún no fueron generados.")
                  : tennisMode
                  ? (data.pairs.length < 2
                    ? "Agregá al menos 2 jugadores para generar los cruces."
                    : "Los cruces aún no fueron generados.")
                  : (data.pairs.length < 2
                    ? "Agregá al menos 2 parejas para generar los cruces."
                    : "Los cruces aún no fueron generados.")}
              </Typography>
              {(teamMode ? (data.teams ?? []).length >= 2 : data.pairs.length >= 2) && (
                <Button
                  variant="contained"
                  onClick={() => setGenerateOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
                >
                  Generar cruces
                </Button>
              )}
            </Box>
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
            <>
              <BracketView
                matches={bracketMatches}
                onEditMatch={m => setEditMatch(m)}
                onVirtualMatchClick={handleVirtualMatchClick}
                sex={data.sex}
                teamMode={teamMode}
              />
              {repechajeMatches.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, textTransform: "uppercase", letterSpacing: 1.1, fontSize: "0.72rem", color: "text.secondary" }}>
                    Repechaje
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {repechajeMatches.map(m => (
                      <MatchCard key={m.id} match={m} onEdit={() => setEditMatch(m)} />
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      <AddTeamDialog
        open={addTeamOpen}
        onClose={() => setAddTeamOpen(false)}
        tournamentId={Number(id)}
        existingTeams={data.teams ?? []}
      />

      <AddPlayerDialog
        open={addPlayerOpen}
        onClose={() => setAddPlayerOpen(false)}
        tournamentId={Number(id)}
        existingPairs={data.pairs}
      />

      <AddPairDialog
        open={addPairOpen}
        onClose={() => setAddPairOpen(false)}
        tournamentId={Number(id)}
        existingPairs={data.pairs}
        tournamentCategory={data.category}
        tournamentStartDate={data.startDate}
      />

      {editPairTarget && (
        <EditPairDialog
          open={!!editPairTarget}
          onClose={() => setEditPairTarget(null)}
          pair={editPairTarget}
          tournamentId={Number(id)}
          existingPairs={data.pairs}
          tournamentCategory={data.category}
          tournamentStartDate={data.startDate}
          hasMatches={hasMatches}
        />
      )}

      <GenerateMatchesDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        pairCount={teamMode ? (data.teams ?? []).length : data.pairs.length}
        tournamentId={Number(id)}
        tournamentStartDate={data.startDate}
        onGenerated={() => {}}
        teamMode={teamMode}
        tennisMode={tennisMode}
      />


      {editMatch && (
        <EditMatchDialog
          open={!!editMatch}
          onClose={() => setEditMatch(null)}
          match={editMatch}
          pairs={data.pairs}
          teams={data.teams ?? []}
          teamMode={teamMode}
          tournamentId={Number(id)}
          totalRounds={isBracket && bracketMatches.length > 0 ? Math.max(...bracketMatches.map(m => m.round)) : undefined}
        />
      )}

      <DeleteDialog
        open={!!deletePairTarget}
        title={tennisMode ? "Eliminar jugador" : "Eliminar pareja"}
        description={tennisMode
          ? "¿Estás seguro de que querés eliminar este jugador del torneo?"
          : "¿Estás seguro de que querés eliminar esta pareja del torneo? Esta acción no se puede deshacer."}
        loading={removePairMutation.isPending}
        onClose={() => setDeletePairTarget(null)}
        onConfirm={() => deletePairTarget && removePairMutation.mutate(deletePairTarget.id)}
      />

      <DeleteDialog
        open={!!deleteTeamTarget}
        title="Eliminar equipo"
        description="¿Estás seguro de que querés eliminar este equipo del torneo?"
        loading={removeTeamMutation.isPending}
        onClose={() => setDeleteTeamTarget(null)}
        onConfirm={() => deleteTeamTarget && removeTeamMutation.mutate(deleteTeamTarget.id)}
      />

      <DeleteDialog
        open={resetConfirmOpen}
        title="Regenerar cruces"
        description="Se eliminarán todos los partidos y resultados actuales. Las parejas se conservan. ¿Querés continuar?"
        confirmLabel="Sí, regenerar"
        loading={resetMutation.isPending}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => resetMutation.mutate()}
      />
    </Box>
  );
}

function RepechajeButton({ tournamentId }: { tournamentId: number }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => triggerRepechage(tournamentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tournamentDetail", String(tournamentId)] }),
  });
  return (
    <Button
      size="small"
      variant="outlined"
      color="warning"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
      sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
    >
      {mutation.isPending ? <CircularProgress size={14} color="inherit" /> : "Configurar repechaje"}
    </Button>
  );
}

function MatchCard({ match, onEdit }: { match: TournamentMatch; onEdit: () => void }) {
  const isTeam = match.team1 !== undefined || match.team2 !== undefined;
  const winnerId = match.winnerId;
  const winnerLabel = isTeam
    ? (match.team1?.id === winnerId ? match.team1?.equipo.name : match.team2?.equipo.name)
    : (match.pair1?.id === winnerId ? pairLabel(match.pair1) : pairLabel(match.pair2));
  const { label1, label2 } = matchLabel(match);

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
          {label1}{" "}
          <span style={{ color: "#aaa", fontWeight: 400 }}>vs</span>{" "}
          {label2}
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
        {winnerId && winnerLabel && (
          <Typography variant="caption" color="success.main" fontWeight={700}>
            · Ganador: {winnerLabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
