import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTournamentById, removePair, removeTeam, resetMatches, triggerRepechage, disqualifyPair, disqualifyTeam, createPlaceholderMatch, deleteMatch } from "../../api/tournamentService";
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
import CustomView from "./CustomView";
import { getInitials, stringToColor } from "../../utils/uiUtils";
import EmptyState from "../../components/common/EmptyState";

const SEX_LABEL: Record<string, string> = {
  MASCULINO: "Masculino",
  FEMENINO: "Femenino",
  MIXTO: "Mixto",
};

const CATEGORY_LABEL: Record<string, string> = {
  PRIMERA: "1ra", SEGUNDA: "2da", TERCERA: "3ra", CUARTA: "4ta",
  QUINTA: "5ta", SEXTA: "6ta", SEPTIMA: "7ma", SIN_CATEGORIA: "Sin categoría",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

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
  if (match.team1 != null || match.team2 != null) {
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
    FORFEIT: { label: "Descalificado", color: "default" },
  };
  const cfg = map[status] ?? { label: status, color: "default" };
  return <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 600, fontSize: "0.7rem" }} />;
}

const listItemHoverSx = {
  "@media (hover: hover)": {
    "&:hover .row-actions": { opacity: 1 },
    ".row-actions": { opacity: 0, transition: "opacity 0.15s ease" },
  },
} as const;

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
  // null = not yet initialized; defaults to matches tab if matches exist
  const [mobileTab, setMobileTab] = useState<number | null>(null);
  const [listCollapsed, setListCollapsed] = useState(false);

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

  const disqualifyPairMutation = useMutation({
    mutationFn: (pairId: number) => disqualifyPair(Number(id), pairId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tournamentDetail", id] }),
  });

  const disqualifyTeamMutation = useMutation({
    mutationFn: (teamId: number) => disqualifyTeam(Number(id), teamId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tournamentDetail", id] }),
  });

  const [deleteMatchTarget, setDeleteMatchTarget] = useState<number | null>(null);
  const [deletePhaseTarget, setDeletePhaseTarget] = useState<number | null>(null);

  const [addMatchError, setAddMatchError] = useState<string | null>(null);
  const addMatchMutation = useMutation({
    mutationFn: ({ round, matchNumber }: { round: number; matchNumber: number }) =>
      createPlaceholderMatch(Number(id), round, matchNumber),
    onSuccess: () => {
      setAddMatchError(null);
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", id] });
    },
    onError: (e: any) => setAddMatchError(
      e?.response?.data?.error ?? e?.response?.data?.message ?? e?.message ?? "Error al agregar el partido"
    ),
  });

  const deleteMatchMutation = useMutation({
    mutationFn: (matchId: number) => deleteMatch(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", id] });
      setDeleteMatchTarget(null);
    },
  });

  const deletePhaseMutation = useMutation({
    mutationFn: async (round: number) => {
      const matchIds = data?.matches.filter(m => m.round === round).map(m => m.id) ?? [];
      await Promise.all(matchIds.map(deleteMatch));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", id] });
      setDeletePhaseTarget(null);
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetMatches(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", id] });
      setResetConfirmOpen(false);
      if (data?.format !== "PERSONALIZADO") setGenerateOpen(true);
    },
  });

  const handleVirtualMatchClick = (round: number, matchNumber: number) => {
    setEditMatch({
      id: -1, round, matchNumber, status: "PENDING",
      pair1: null, pair2: null, court: null, scheduledAt: null, winnerId: null, result: null,
    } as TournamentMatch);
  };

  if (isPending) return <PageLoader />;
  if (error || !data) {
    return <Alert severity="error">{error ? String(error) : "Torneo no encontrado"}</Alert>;
  }

  const hasMatches = data.matches.length > 0;
  const isBracket = data.format === "BRACKET";
  const isCustom = data.format === "PERSONALIZADO";
  const teamMode = isTeamSport(data.sport);
  const tennisMode = data.sport === "TENIS";

  const bracketMatches = data.matches.filter(m => !m.isRepechage);
  const repechajeMatches = data.matches.filter(m => m.isRepechage);
  const round1Regular = data.matches.filter(m => m.round === 1 && !m.isRepechage);
  const round1Done = round1Regular.length > 0 && round1Regular.every(m => m.status !== "PENDING");
  const canTriggerRepechaje = isBracket && round1Done && repechajeMatches.some(m => teamMode ? !m.team2 : !m.pair2);

  // Progress stats (exclude BYEs from totals)
  const playableMatches = data.matches.filter(m => m.status !== "BYE");
  const completedMatches = playableMatches.filter(m => m.status === "COMPLETED" || m.status === "FORFEIT");
  const progressPct = playableMatches.length > 0 ? Math.round((completedMatches.length / playableMatches.length) * 100) : 0;

  // Default mobile tab: matches if matches exist, list otherwise
  const effectiveMobileTab = mobileTab ?? (hasMatches ? 1 : 0);

  // Can user generate matches?
  const participantCount = teamMode ? (data.teams ?? []).length : data.pairs.length;
  const canGenerate = participantCount >= 2;

  // Max bracket round (for scroll hint)
  const maxBracketRound = bracketMatches.length > 0 ? Math.max(...bracketMatches.map(m => m.round)) : 0;

  const handleAddMatchToRound = (round: number) => {
    setAddMatchError(null);
    const inRound = data.matches.filter(m => m.round === round && !m.isRepechage);
    const nextMatchNumber = inRound.length + 1;
    addMatchMutation.mutate({ round, matchNumber: nextMatchNumber });
  };

  const handleAddNewRound = (round?: number) => {
    setAddMatchError(null);
    const next = round ?? (data.matches.length > 0 ? Math.max(...data.matches.map(m => m.round)) + 1 : 1);
    addMatchMutation.mutate({ round: next, matchNumber: 1 });
  };

  // ── List panel ─────────────────────────────────────────────────────────────
  const listPanel = teamMode ? (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Typography variant="h6" fontWeight={700}>Equipos ({(data.teams ?? []).length})</Typography>
        {!hasMatches && (
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setAddTeamOpen(true)} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
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
                sx={listItemHoverSx}
                secondaryAction={
                  <Box className="row-actions" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Tooltip title={team.disqualified ? "Rehabilitar equipo" : "Descalificar equipo"}>
                      <IconButton size="small" color={team.disqualified ? "warning" : "default"} onClick={() => disqualifyTeamMutation.mutate(team.id)}>
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar equipo">
                      <IconButton edge="end" size="small" color="error" onClick={() => setDeleteTeamTarget(team)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
        <Typography variant="h6" fontWeight={700}>Jugadores ({data.pairs.length})</Typography>
        {!hasMatches && (
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setAddPlayerOpen(true)} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
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
                sx={listItemHoverSx}
                secondaryAction={
                  <Box className="row-actions" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Tooltip title={pair.disqualified ? "Rehabilitar jugador" : "Descalificar jugador"}>
                      <IconButton size="small" color={pair.disqualified ? "warning" : "default"} onClick={() => disqualifyPairMutation.mutate(pair.id)}>
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar jugador">
                      <IconButton edge="end" size="small" color="error" onClick={() => setDeletePairTarget(pair)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
        <Typography variant="h6" fontWeight={700}>Parejas ({data.pairs.length})</Typography>
        {!hasMatches && (
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setAddPairOpen(true)} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
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
                sx={listItemHoverSx}
                secondaryAction={
                  <Box className="row-actions" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Tooltip title="Editar pareja">
                      <IconButton size="small" onClick={() => setEditPairTarget(pair)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={pair.disqualified ? "Rehabilitar pareja" : "Descalificar pareja"}>
                      <IconButton size="small" color={pair.disqualified ? "warning" : "default"} onClick={() => disqualifyPairMutation.mutate(pair.id)}>
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar pareja">
                      <IconButton edge="end" size="small" color="error" onClick={() => setDeletePairTarget(pair)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      width: 36, height: 36, fontSize: "0.75rem", fontWeight: 700,
                      bgcolor: pair.disqualified ? "grey.400" : stringToColor(pair.player1.name + (pair.player2?.name ?? "")),
                      opacity: pair.disqualified ? 0.6 : 1,
                    }}
                  >
                    {pairInitials(pair)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                      <Typography variant="body2" fontWeight={600} sx={{ color: pair.disqualified ? "text.disabled" : undefined, textDecoration: pair.disqualified ? "line-through" : undefined }}>{pair.player1.name}</Typography>
                      {!pair.disqualified && pair.player1InscriptionPaid && (
                        <Typography component="span" sx={{ fontSize: "0.8rem", fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>$</Typography>
                      )}
                      {pair.disqualified && <Chip label="Descalificado" size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: "grey.200", color: "text.disabled" }} />}
                    </Box>
                  }
                  secondary={pair.player2 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                      <Typography variant="caption" sx={{ color: pair.disqualified ? "text.disabled" : "text.secondary", textDecoration: pair.disqualified ? "line-through" : undefined }}>{pair.player2.name}</Typography>
                      {!pair.disqualified && pair.player2InscriptionPaid && (
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
  );

  // ── Matches panel ──────────────────────────────────────────────────────────
  const matchesPanel = (
    <>
      {/* Header row */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title={listCollapsed
            ? (teamMode ? "Mostrar equipos" : tennisMode ? "Mostrar jugadores" : "Mostrar parejas")
            : (teamMode ? "Ocultar equipos" : tennisMode ? "Ocultar jugadores" : "Ocultar parejas")
          }>
            <IconButton
              size="small"
              onClick={() => setListCollapsed(c => !c)}
              sx={{ display: { xs: "none", md: "flex" }, color: "text.secondary" }}
            >
              {listCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Typography variant="h6" fontWeight={700}>Partidos</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {!hasMatches && canGenerate && !isCustom && (
            <Button
              size="small"
              variant="contained"
              onClick={() => setGenerateOpen(true)}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
            >
              Generar cruces
            </Button>
          )}
          {canTriggerRepechaje && <RepechajeButton tournamentId={Number(id)} />}
          {hasMatches && (isCustom || !isBracket || !round1Done) && (
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

      {/* Progress bar */}
      {hasMatches && playableMatches.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {completedMatches.length} de {playableMatches.length} partidos completados
            </Typography>
            <Typography variant="caption" fontWeight={700} color="primary.main">
              {progressPct}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPct}
            color="primary"
            sx={{ height: 6, borderRadius: 3, bgcolor: "grey.100" }}
          />
        </Box>
      )}

      {/* Personalizado */}
      {isCustom && (
        <CustomView
          tournamentId={Number(id)}
          matches={data.matches}
          teamMode={teamMode}
          sex={data.sex}
          onEditMatch={m => setEditMatch(m)}
          onAddMatchToPhase={handleAddMatchToRound}
          onAddPhase={handleAddNewRound}
          onDeleteMatch={id => setDeleteMatchTarget(id)}
          onDeletePhase={round => setDeletePhaseTarget(round)}
          loading={addMatchMutation.isPending}
          error={addMatchError}
          onClearError={() => setAddMatchError(null)}
        />
      )}

      {/* Empty state (non-custom) */}
      {!isCustom && !hasMatches && (
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
        </Box>
      )}

      {/* Round robin list */}
      {!isCustom && hasMatches && !isBracket && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {data.matches.map(m => (
            <MatchCard key={m.id} match={m} onEdit={() => setEditMatch(m)} />
          ))}
        </Box>
      )}

      {/* Bracket */}
      {!isCustom && hasMatches && isBracket && (
        <>
          {maxBracketRound >= 3 && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 0.5, mb: 1, fontStyle: "italic" }}
            >
              ← Deslizá para ver todas las rondas
            </Typography>
          )}
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
    </>
  );

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
        subtitle={`${formatDate(data.startDate)} → ${formatDate(data.endDate)}`}
        action={
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {data.category && data.category !== "SIN_CATEGORIA" && (
              <Chip
                label={CATEGORY_LABEL[data.category] ?? data.category}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            )}
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
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            )}
            <Chip
              label={isCustom && data.status === "COMPLETED" ? "Finalizado" : getDateStatus(data.startDate, data.endDate).label}
              color={isCustom && data.status === "COMPLETED" ? "primary" : getDateStatus(data.startDate, data.endDate).color}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        }
      />

      {/* ── Mobile: tabs ──────────────────────────────────────────────────── */}
      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <Tabs
          value={effectiveMobileTab}
          onChange={(_: React.SyntheticEvent, v: number) => setMobileTab(v)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ borderBottom: 1, borderColor: "divider", mb: 2, minHeight: 44 }}
        >
          <Tab
            label={
              teamMode
                ? `Equipos (${(data.teams ?? []).length})`
                : tennisMode
                ? `Jugadores (${data.pairs.length})`
                : `Parejas (${data.pairs.length})`
            }
            sx={{ textTransform: "none", fontWeight: 600, minHeight: 44, fontSize: "0.875rem" }}
          />
          <Tab
            label={`Partidos${playableMatches.length > 0 ? ` (${completedMatches.length}/${playableMatches.length})` : ""}`}
            sx={{ textTransform: "none", fontWeight: 600, minHeight: 44, fontSize: "0.875rem" }}
          />
        </Tabs>
        {effectiveMobileTab === 0 ? listPanel : matchesPanel}
      </Box>

      {/* ── Desktop: side-by-side with collapsible list ────────────────────── */}
      <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3, alignItems: "flex-start" }}>
        {!listCollapsed && (
          <Box sx={{ width: { md: 280, lg: 300 }, flexShrink: 0, minWidth: 0 }}>
            {listPanel}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {matchesPanel}
        </Box>
      </Box>

      {/* ── Dialogs ───────────────────────────────────────────────────────── */}
      <AddTeamDialog
        open={addTeamOpen}
        onClose={() => setAddTeamOpen(false)}
        tournamentId={Number(id)}
        existingTeams={data.teams ?? []}
        sport={data.sport}
      />
      <AddPlayerDialog
        open={addPlayerOpen}
        onClose={() => setAddPlayerOpen(false)}
        tournamentId={Number(id)}
        existingPairs={data.pairs}
        sport={data.sport}
      />
      <AddPairDialog
        open={addPairOpen}
        onClose={() => setAddPairOpen(false)}
        tournamentId={Number(id)}
        existingPairs={data.pairs}
        tournamentCategory={data.category}
        tournamentStartDate={data.startDate}
        sport={data.sport}
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
        sport={data.sport}
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
          sport={data.sport}
          totalRounds={isBracket && bracketMatches.length > 0 ? Math.max(...bracketMatches.map(m => m.round)) : undefined}
          isCustomTournament={isCustom}
          tournamentStartDate={data.startDate}
          tournamentEndDate={data.endDate}
        />
      )}
      <DeleteDialog
        open={!!deletePairTarget}
        title={tennisMode ? "Eliminar jugador" : "Eliminar pareja"}
        description={tennisMode
          ? `¿Eliminar este jugador del torneo?${hasMatches ? " Los partidos asignados quedarán libres." : ""}`
          : `¿Eliminar esta pareja del torneo?${hasMatches ? " Los partidos asignados quedarán libres." : " Esta acción no se puede deshacer."}`}
        loading={removePairMutation.isPending}
        onClose={() => setDeletePairTarget(null)}
        onConfirm={() => deletePairTarget && removePairMutation.mutate(deletePairTarget.id)}
      />
      <DeleteDialog
        open={!!deleteTeamTarget}
        title="Eliminar equipo"
        description={`¿Eliminar este equipo del torneo?${hasMatches ? " Los partidos asignados quedarán libres." : ""}`}
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
      <DeleteDialog
        open={deleteMatchTarget !== null}
        title="Eliminar partido"
        description="¿Eliminar este partido de la fase? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={deleteMatchMutation.isPending}
        onClose={() => setDeleteMatchTarget(null)}
        onConfirm={() => deleteMatchTarget !== null && deleteMatchMutation.mutate(deleteMatchTarget)}
      />
      <DeleteDialog
        open={deletePhaseTarget !== null}
        title="Eliminar fase"
        description="Se eliminarán todos los partidos de esta fase. Esta acción no se puede deshacer."
        confirmLabel="Eliminar fase"
        loading={deletePhaseMutation.isPending}
        onClose={() => setDeletePhaseTarget(null)}
        onConfirm={() => deletePhaseTarget !== null && deletePhaseMutation.mutate(deletePhaseTarget)}
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
      {mutation.isPending ? <PageLoader size={14} /> : "Configurar repechaje"}
    </Button>
  );
}

function MatchCard({ match, onEdit }: { match: TournamentMatch; onEdit: () => void }) {
  const isTeam = match.team1 != null || match.team2 != null;
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
      <Box sx={{ display: "flex", gap: 1, mt: 0.75, flexWrap: "wrap", alignItems: "center" }}>
        <Typography variant="caption" color="text.secondary">
          {formatScheduledAt(match.scheduledAt)}
        </Typography>
        {match.court && (
          <Typography variant="caption" color="text.secondary">· {match.court.name}</Typography>
        )}
        {match.result && (
          <Typography variant="caption" fontWeight={700} color="text.primary">· {match.result}</Typography>
        )}
        {winnerId && winnerLabel && (
          <Typography variant="caption" color="success.main" fontWeight={700}>· Ganador: {winnerLabel}</Typography>
        )}
      </Box>
    </Box>
  );
}
