import { useState } from "react";
import { Alert, Avatar, Box, Button, Chip, IconButton, InputBase, Paper, Popover, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import type { TournamentMatch, Pair, TournamentTeam } from "../../types/Tournament";
import PageLoader from "../../components/common/PageLoader";
import ChampionBanner from "../../components/common/ChampionBanner";
import { getInitials, stringToColor } from "../../utils/uiUtils";

const COL_W = 220;
const COL_GAP = 32;
const MATCH_H = 96;

// ── Phase name storage ────────────────────────────────────────────────────────

function usePhaseNames(tournamentId: number) {
  const key = `phaseNames_${tournamentId}`;
  const [names, setNames] = useState<Record<number, string>>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? "{}"); } catch { return {}; }
  });

  const setName = (round: number, name: string) => {
    setNames(prev => {
      const next = { ...prev, [round]: name };
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  return { names, setName };
}

// ── Editable phase name ───────────────────────────────────────────────────────

const PHASE_PRESETS = ["Octavos", "Cuartos", "Semis", "Final"];

function EditablePhaseName({ name, nextFaseNumber, onSave }: { name: string; nextFaseNumber: number; onSave: (v: string) => void }) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [customVal, setCustomVal] = useState("");

  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setCustomVal(name);
    setAnchorEl(e.currentTarget);
  };

  const handleSelect = (value: string) => {
    onSave(value);
    setAnchorEl(null);
  };

  const handleCustomSave = () => {
    if (customVal.trim()) onSave(customVal.trim());
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title="Editar nombre de fase" placement="top">
        <Box
          onClick={handleOpen}
          sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", "&:hover .edit-ph": { opacity: 1 } }}
        >
          <Typography
            variant="caption"
            fontWeight={800}
            sx={{ textTransform: "uppercase", letterSpacing: 1.2, fontSize: "0.7rem", color: "primary.main" }}
          >
            {name}
          </Typography>
          <EditIcon className="edit-ph" sx={{ fontSize: 11, color: "primary.main", opacity: 0, transition: "opacity 0.15s" }} />
        </Box>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{ sx: { borderRadius: 2, p: 1.5, minWidth: 220, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" } }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
          <Chip
            label={`Fase ${nextFaseNumber}`}
            size="small"
            onClick={() => handleSelect(`Fase ${nextFaseNumber}`)}
            sx={{ fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}
          />
          {PHASE_PRESETS.map(p => (
            <Chip
              key={p}
              label={p}
              size="small"
              onClick={() => handleSelect(p)}
              sx={{ fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}
            />
          ))}
        </Box>
        <InputBase
          value={customVal}
          onChange={e => setCustomVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") handleCustomSave();
            if (e.key === "Escape") setAnchorEl(null);
          }}
          autoFocus
          placeholder="Nombre personalizado"
          endAdornment={
            <IconButton size="small" onClick={handleCustomSave} sx={{ color: "primary.main" }}>
              <CheckIcon sx={{ fontSize: 16 }} />
            </IconButton>
          }
          sx={{
            border: "1px solid", borderColor: "divider", borderRadius: 1.5,
            px: 1.25, py: 0.4, fontSize: "0.82rem", width: "100%",
          }}
        />
      </Popover>
    </>
  );
}

// ── Match rows ────────────────────────────────────────────────────────────────

function PairRow({ pair, isWinner, isLoser }: { pair: Pair | null | undefined; isWinner: boolean; isLoser: boolean }) {
  const dim = isLoser;
  if (!pair) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 2 }}>
        <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.disabled", fontWeight: 500 }}>A definir</Typography>
      </Box>
    );
  }
  const p1 = pair.player1.name.split(" ")[0];
  return (
    <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 1.5, gap: 0.5, overflow: "hidden", bgcolor: isWinner ? "rgba(16,185,129,0.05)" : "transparent" }}>
      <Avatar
        src={pair.player1.avatarUrl}
        sx={{ width: 18, height: 18, fontSize: "0.45rem", fontWeight: 700, bgcolor: dim ? "#cbd5e1" : stringToColor(pair.player1.name), opacity: dim ? 0.5 : 1, flexShrink: 0 }}
      >
        {!pair.player1.avatarUrl && getInitials(pair.player1.name)}
      </Avatar>
      <Typography noWrap sx={{ fontSize: "0.78rem", fontWeight: isWinner ? 700 : 500, color: dim ? "text.disabled" : "text.primary", flexShrink: 1, minWidth: 0 }}>
        {p1}
      </Typography>
      {pair.player2 && (
        <>
          <Typography sx={{ fontSize: "0.72rem", color: "text.disabled", flexShrink: 0 }}>/</Typography>
          <Avatar
            src={pair.player2.avatarUrl}
            sx={{ width: 18, height: 18, fontSize: "0.45rem", fontWeight: 700, bgcolor: dim ? "#cbd5e1" : stringToColor(pair.player2.name), opacity: dim ? 0.5 : 1, flexShrink: 0 }}
          >
            {!pair.player2.avatarUrl && getInitials(pair.player2.name)}
          </Avatar>
          <Typography noWrap sx={{ fontSize: "0.78rem", fontWeight: isWinner ? 700 : 500, color: dim ? "text.disabled" : "text.primary", flex: 1, minWidth: 0 }}>
            {pair.player2.name.split(" ")[0]}
          </Typography>
        </>
      )}
      {isWinner && <EmojiEventsIcon sx={{ fontSize: 13, color: "#f5ad27", flexShrink: 0 }} />}
    </Box>
  );
}

function TeamRow({ team, isWinner, isLoser }: { team: TournamentTeam | null | undefined; isWinner: boolean; isLoser: boolean }) {
  const dim = isLoser;
  if (!team) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 2 }}>
        <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "text.disabled", fontWeight: 500 }}>A definir</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 1.5, gap: 0.5, overflow: "hidden", bgcolor: isWinner ? "rgba(16,185,129,0.05)" : "transparent" }}>
      <Avatar
        src={team.equipo.avatarUrl}
        sx={{ width: 18, height: 18, fontSize: "0.45rem", fontWeight: 700, bgcolor: dim ? "#cbd5e1" : stringToColor(team.equipo.name), opacity: dim ? 0.5 : 1, flexShrink: 0 }}
      >
        {!team.equipo.avatarUrl && getInitials(team.equipo.name)}
      </Avatar>
      <Typography noWrap sx={{ fontSize: "0.78rem", fontWeight: isWinner ? 700 : 500, color: dim ? "text.disabled" : "text.primary", flex: 1, minWidth: 0 }}>
        {team.equipo.name}
      </Typography>
      {isWinner && <EmojiEventsIcon sx={{ fontSize: 13, color: "#f5ad27", flexShrink: 0 }} />}
    </Box>
  );
}

// ── Match card ────────────────────────────────────────────────────────────────

function CustomMatchCard({ match, onEdit, onDelete, teamMode }: { match: TournamentMatch; onEdit: () => void; onDelete: () => void; teamMode?: boolean }) {
  const isCompleted = match.status === "COMPLETED";
  const isForfeit = match.status === "FORFEIT";
  const pair1Won = match.winnerId != null && (teamMode ? match.team1?.id === match.winnerId : match.pair1?.id === match.winnerId);
  const pair2Won = match.winnerId != null && (teamMode ? match.team2?.id === match.winnerId : match.pair2?.id === match.winnerId);
  const stripeColor = isCompleted ? "#10b981" : isForfeit ? "#94a3b8" : "#cbd5e1";

  return (
    <Box sx={{ position: "relative", "&:hover .match-delete": { opacity: 1 } }}>
    <Paper
      elevation={0}
      onClick={onEdit}
      sx={{
        width: "100%", height: MATCH_H,
        border: "1px solid",
        borderColor: isCompleted ? "#d1fae5" : "#e2e8f0",
        bgcolor: "#fff",
        borderRadius: 3, overflow: "hidden",
        display: "flex",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 16px rgba(0,0,0,0.1)", borderColor: "#cbd5e1" },
      }}
    >
      <Box sx={{ width: 6, flexShrink: 0, bgcolor: stripeColor }} />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {teamMode ? (
          <TeamRow team={match.team1} isWinner={pair1Won} isLoser={pair2Won} />
        ) : (
          <PairRow pair={match.pair1} isWinner={pair1Won} isLoser={pair2Won} />
        )}
        <Box sx={{ height: "1px", bgcolor: "#f1f5f9" }} />
        {teamMode ? (
          <TeamRow team={match.team2} isWinner={pair2Won} isLoser={pair1Won} />
        ) : (
          <PairRow pair={match.pair2} isWinner={pair2Won} isLoser={pair1Won} />
        )}
        <Box sx={{ px: 1.5, py: 0.5, bgcolor: "grey.50", display: "flex", alignItems: "center", gap: 1, mt: "auto" }}>
          {match.result ? (
            <Typography variant="caption" fontWeight={800} sx={{ fontSize: "0.7rem" }}>{match.result}</Typography>
          ) : match.scheduledAt ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.disabled" }}>
              <AccessTimeIcon sx={{ fontSize: 10 }} />
              <Typography variant="caption" sx={{ fontSize: "0.65rem", fontWeight: 600 }}>
                {new Date(match.scheduledAt).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.disabled" }}>Pendiente</Typography>
          )}
        </Box>
      </Box>
    </Paper>
    <Tooltip title="Eliminar partido">
      <IconButton
        className="match-delete"
        size="small"
        onClick={e => { e.stopPropagation(); onDelete(); }}
        sx={{
          position: "absolute", top: 4, right: 4,
          opacity: 0, transition: "opacity 0.15s",
          bgcolor: "background.paper", boxShadow: 1,
          color: "error.main",
          width: 22, height: 22,
          "&:hover": { bgcolor: "error.50" },
        }}
      >
        <DeleteIcon sx={{ fontSize: 13 }} />
      </IconButton>
    </Tooltip>
    </Box>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  tournamentId: number;
  matches: TournamentMatch[];
  teamMode?: boolean;
  sex?: string | null;
  onEditMatch: (m: TournamentMatch) => void;
  onAddMatchToPhase: (round: number) => void;
  onAddPhase: () => void;
  onDeleteMatch: (matchId: number) => void;
  onDeletePhase: (round: number) => void;
  loading?: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export default function CustomView({ tournamentId, matches, teamMode, sex, onEditMatch, onAddMatchToPhase, onAddPhase, onDeleteMatch, onDeletePhase, loading, error, onClearError }: Props) {
  const { names, setName } = usePhaseNames(tournamentId);

  const phases: Record<number, TournamentMatch[]> = {};
  matches.forEach(m => {
    if (!phases[m.round]) phases[m.round] = [];
    phases[m.round].push(m);
  });
  const rounds = Object.keys(phases).map(Number).sort((a, b) => a - b);

  // Same height for all columns so cards center-align across phases
  const CARD_GAP = 12; // matches gap: 1.5 (MUI 8px * 1.5)
  const maxCards = rounds.length > 0 ? Math.max(...rounds.map(r => phases[r].length)) : 1;
  const matchAreaH = maxCards * MATCH_H + (maxCards - 1) * CARD_GAP;

  const getPhaseName = (round: number, idx: number) => names[round] ?? `Fase ${idx + 1}`;

  const getNextFaseNumber = (currentRound: number) => {
    const faseNums = rounds
      .filter(r => r !== currentRound)
      .map((r, i) => {
        const n = names[r] ?? `Fase ${i + 1}`;
        const m = n.match(/^Fase (\d+)$/);
        return m ? parseInt(m[1]) : 0;
      });
    return Math.max(0, ...faseNums) + 1;
  };

  // Champion: detect completed Final phase with a winner
  let champion: Pair | null = null;
  let championLabel: string | undefined;
  const finalRound = rounds.find((r, i) => (names[r] ?? `Fase ${i + 1}`).toLowerCase() === "final");
  if (finalRound !== undefined) {
    const finalMatch = (phases[finalRound] ?? []).find(m => m.winnerId != null && m.status === "COMPLETED");
    if (finalMatch) {
      if (teamMode) {
        const winTeam = finalMatch.team1?.id === finalMatch.winnerId ? finalMatch.team1 : finalMatch.team2;
        championLabel = winTeam?.equipo?.name;
      } else {
        champion = finalMatch.pair1?.id === finalMatch.winnerId
          ? (finalMatch.pair1 ?? null)
          : (finalMatch.pair2 ?? null);
      }
    }
  }

  if (rounds.length === 0) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 6 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No hay fases ni partidos. Comenzá agregando la primera fase.
        </Typography>
        {error && <Alert severity="error" onClose={onClearError} sx={{ width: "100%", maxWidth: 360 }}>{error}</Alert>}
        <Button
          variant="contained"
          startIcon={loading ? <PageLoader size={14} /> : <AddIcon />}
          onClick={() => onAddPhase()}
          disabled={loading}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
        >
          Agregar primera fase
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" onClose={onClearError} sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ overflowX: "auto", pb: 2 }}>
        <Box sx={{ display: "flex", gap: `${COL_GAP}px`, alignItems: "flex-start", minWidth: "fit-content" }}>
          {rounds.map((round, rIdx) => (
            <Box key={round} sx={{ width: COL_W, flexShrink: 0 }}>
              {/* Phase header */}
              <Box sx={{ mb: 1.5, display: "flex", justifyContent: "center", position: "relative", "&:hover .phase-delete": { opacity: 1 } }}>
                <Paper elevation={0} sx={{ py: 0.75, px: 2, borderRadius: 2, bgcolor: "grey.50", display: "inline-flex", alignItems: "center" }}>
                  <EditablePhaseName
                    name={getPhaseName(round, rIdx)}
                    nextFaseNumber={getNextFaseNumber(round)}
                    onSave={v => setName(round, v)}
                  />
                </Paper>
                <Tooltip title="Eliminar fase">
                  <IconButton
                    className="phase-delete"
                    size="small"
                    onClick={() => onDeletePhase(round)}
                    sx={{
                      position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
                      opacity: 0, transition: "opacity 0.15s",
                      color: "error.main", width: 22, height: 22,
                      "&:hover": { bgcolor: "error.50" },
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Matches — fixed height so cards center across columns */}
              <Box sx={{ height: matchAreaH, display: "flex", flexDirection: "column", justifyContent: "center", gap: 1.5, mb: 1.5 }}>
                {phases[round].map(m => (
                  <CustomMatchCard key={m.id} match={m} onEdit={() => onEditMatch(m)} onDelete={() => onDeleteMatch(m.id)} teamMode={teamMode} />
                ))}
              </Box>

              {/* Add match to this phase */}
              <Button
                size="small"
                fullWidth
                variant="outlined"
                startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                onClick={() => onAddMatchToPhase(round)}
                disabled={loading}
                sx={{
                  textTransform: "none", fontSize: "0.78rem", fontWeight: 600,
                  borderRadius: 2, color: "text.secondary", borderColor: "divider",
                  "&:hover": { borderColor: "primary.main", color: "primary.main", bgcolor: "primary.50" },
                }}
              >
                Agregar partido
              </Button>
            </Box>
          ))}

          {/* Add new phase */}
          <Box sx={{ flexShrink: 0, alignSelf: "flex-start", pt: 0.25 }}>
            <Button
              variant="outlined"
              startIcon={loading ? <PageLoader size={14} /> : <AddIcon />}
              onClick={() => onAddPhase()}
              disabled={loading}
              sx={{
                textTransform: "none", fontWeight: 600, borderRadius: 2,
                color: "text.secondary", borderColor: "divider", whiteSpace: "nowrap",
                "&:hover": { borderColor: "primary.main", color: "primary.main", bgcolor: "primary.50" },
              }}
            >
              Nueva fase
            </Button>
          </Box>
        </Box>
      </Box>

      {(champion || championLabel) && (
        <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
          <Box sx={{ width: "100%", maxWidth: 360 }}>
            <ChampionBanner champion={champion ?? undefined} championLabel={championLabel} sex={sex} />
          </Box>
        </Box>
      )}
    </Box>
  );
}
