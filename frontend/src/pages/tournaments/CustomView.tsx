import { Alert, Box, Button, Chip, CircularProgress, Divider, IconButton, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import type { TournamentMatch, Pair, TournamentTeam } from "../../types/Tournament";

// ── Helpers ─────────────────────────────────────────────────────────────────

function pairLabel(pair: Pair | null | undefined): string {
  if (!pair) return "A definir";
  if (!pair.player2) return pair.player1.name;
  return `${pair.player1.name} / ${pair.player2.name}`;
}

function teamLabel(team: TournamentTeam | null | undefined): string {
  if (!team) return "A definir";
  return team.equipo.name;
}

function matchLabel(match: TournamentMatch): { label1: string; label2: string } {
  if (match.team1 != null || match.team2 != null) {
    return { label1: teamLabel(match.team1), label2: teamLabel(match.team2) };
  }
  return { label1: pairLabel(match.pair1), label2: pairLabel(match.pair2) };
}

function formatScheduledAt(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-AR", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function MatchStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: "default" | "warning" | "success" | "info" }> = {
    PENDING: { label: "Pendiente", color: "warning" },
    COMPLETED: { label: "Completado", color: "success" },
    BYE: { label: "BYE", color: "info" },
    FORFEIT: { label: "Descalificado", color: "default" },
  };
  const cfg = map[status] ?? { label: status, color: "default" };
  return <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 600, fontSize: "0.7rem" }} />;
}

// ── Phase match card ─────────────────────────────────────────────────────────

function PhaseMatchCard({ match, onEdit }: { match: TournamentMatch; onEdit: () => void }) {
  const { label1, label2 } = matchLabel(match);
  const isCompleted = match.status === "COMPLETED";
  const winner = match.winnerId != null
    ? (match.pair1?.id === match.winnerId ? label1 : match.pair2?.id === match.winnerId ? label2 : match.team1?.id === match.winnerId ? label1 : label2)
    : null;

  return (
    <Box
      sx={{
        display: "flex", alignItems: "center", gap: 1.5,
        p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2,
        bgcolor: isCompleted ? "grey.50" : "background.paper",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.4 }}>
          {label1}{" "}
          <span style={{ color: "#aaa", fontWeight: 400, fontSize: "0.8rem" }}>vs</span>{" "}
          {label2}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap", alignItems: "center" }}>
          {match.scheduledAt && (
            <Typography variant="caption" color="text.secondary">{formatScheduledAt(match.scheduledAt)}</Typography>
          )}
          {match.court && (
            <Typography variant="caption" color="text.secondary">· {match.court.name}</Typography>
          )}
          {match.result && (
            <Typography variant="caption" fontWeight={700}>· {match.result}</Typography>
          )}
          {winner && (
            <Typography variant="caption" color="success.main" fontWeight={700}>· Ganador: {winner}</Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
        <MatchStatusBadge status={match.status} />
        <Tooltip title="Editar partido">
          <IconButton size="small" onClick={onEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  matches: TournamentMatch[];
  teamMode?: boolean;
  onEditMatch: (m: TournamentMatch) => void;
  onAddMatchToPhase: (round: number) => void;
  onAddPhase: () => void;
  loading?: boolean;
  error?: string | null;
}

export default function CustomView({ matches, onEditMatch, onAddMatchToPhase, onAddPhase, loading, error }: Props) {
  const phases: Record<number, TournamentMatch[]> = {};
  matches.forEach(m => {
    if (!phases[m.round]) phases[m.round] = [];
    phases[m.round].push(m);
  });
  const rounds = Object.keys(phases).map(Number).sort((a, b) => a - b);

  if (rounds.length === 0) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 6 }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No hay fases ni partidos. Comenzá agregando la primera fase.
        </Typography>
        {error && <Alert severity="error" sx={{ width: "100%", maxWidth: 360 }}>{error}</Alert>}
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}
          onClick={onAddPhase}
          disabled={loading}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
        >
          Agregar primera fase
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {rounds.map((round, rIdx) => (
        <Box key={round}>
          {/* Phase header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
            <Typography
              variant="caption"
              fontWeight={800}
              sx={{
                textTransform: "uppercase",
                letterSpacing: 1.2,
                fontSize: "0.7rem",
                color: "primary.main",
                bgcolor: "primary.50",
                px: 1.25,
                py: 0.4,
                borderRadius: 1.5,
              }}
            >
              Fase {rIdx + 1}
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Box>

          {/* Matches */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 1.5 }}>
            {phases[round].map(m => (
              <PhaseMatchCard key={m.id} match={m} onEdit={() => onEditMatch(m)} />
            ))}
          </Box>

          {/* Add match to this phase */}
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon sx={{ fontSize: 13 }} />}
            onClick={() => onAddMatchToPhase(round)}
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
      <Box sx={{ pt: 0.5 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onAddPhase}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
        >
          Agregar fase
        </Button>
      </Box>
    </Box>
  );
}
