import { useState } from "react";
import {
  Box, Chip, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tabs, Tab, Typography,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useQuery } from "@tanstack/react-query";
import { fetchStandings } from "../../api/tournamentService";
import type { StandingsEntry } from "../../types/Tournament";
import type { TournamentMatch } from "../../types/Tournament";

function positionColor(pos: number): string {
  if (pos === 1) return "#F5AD27";
  if (pos === 2) return "#9e9e9e";
  if (pos === 3) return "#cd7f32";
  return "transparent";
}

function StandingsTable({ entries, isTeamSport }: { entries: StandingsEntry[]; isTeamSport: boolean }) {
  const hasDraw = entries.some(e => e.drawn > 0);

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", width: 32, pl: 1.5 }}>#</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Nombre</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem", width: 36 }}>PJ</TableCell>
            <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem", width: 36 }}>G</TableCell>
            {hasDraw && <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem", width: 36 }}>E</TableCell>}
            <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem", width: 36 }}>P</TableCell>
            {isTeamSport && (
              <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem", width: 56, display: { xs: "none", sm: "table-cell" } }}>DIF</TableCell>
            )}
            <TableCell align="center" sx={{ fontWeight: 700, fontSize: "0.75rem", width: 44 }}>Pts</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((e, idx) => {
            const pos = idx + 1;
            const dot = positionColor(pos);
            return (
              <TableRow key={e.id} sx={{ "&:last-child td": { border: 0 }, bgcolor: pos === 1 ? "rgba(245,173,39,0.06)" : "inherit" }}>
                <TableCell sx={{ pl: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    {pos <= 3 ? (
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: dot, flexShrink: 0 }} />
                    ) : (
                      <Box sx={{ width: 8, flexShrink: 0 }} />
                    )}
                    <Typography variant="caption" fontWeight={pos === 1 ? 800 : 600} color={pos === 1 ? "warning.dark" : "text.secondary"}>
                      {pos}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    {pos === 1 && <EmojiEventsIcon sx={{ fontSize: 14, color: "#F5AD27" }} />}
                    <Typography variant="body2" fontWeight={pos === 1 ? 800 : pos <= 3 ? 700 : 400} noWrap>
                      {e.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="center"><Typography variant="body2" color="text.secondary">{e.played}</Typography></TableCell>
                <TableCell align="center"><Typography variant="body2" fontWeight={600} color="success.main">{e.won}</Typography></TableCell>
                {hasDraw && <TableCell align="center"><Typography variant="body2" color="text.secondary">{e.drawn}</Typography></TableCell>}
                <TableCell align="center"><Typography variant="body2" color="error.main">{e.lost}</Typography></TableCell>
                {isTeamSport && (
                  <TableCell align="center" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    <Typography variant="body2" color="text.secondary">
                      {e.goalsFor > 0 || e.goalsAgainst > 0
                        ? `${e.goalsFor > e.goalsAgainst ? "+" : ""}${e.goalsFor - e.goalsAgainst}`
                        : "—"}
                    </Typography>
                  </TableCell>
                )}
                <TableCell align="center">
                  <Chip
                    label={e.points}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.78rem",
                      height: 22,
                      bgcolor: pos === 1 ? "#F5AD27" : "grey.100",
                      color: pos === 1 ? "#111" : "text.primary",
                    }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
          {entries.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                <Typography variant="body2" color="text.disabled">
                  Los resultados aparecerán aquí a medida que se completen los partidos.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

interface Props {
  tournamentId: number;
  matches: TournamentMatch[];
  isTeamSport: boolean;
  onEditMatch: (m: TournamentMatch) => void;
  MatchCardComponent: React.ComponentType<{ match: TournamentMatch; onEdit: () => void }>;
}

export default function RoundRobinView({ tournamentId, matches, isTeamSport, onEditMatch, MatchCardComponent }: Props) {
  const [tab, setTab] = useState(0);

  const { data: standings = [] } = useQuery<StandingsEntry[]>({
    queryKey: ["standings", tournamentId],
    queryFn: () => fetchStandings(tournamentId),
    staleTime: 10_000,
  });

  const playable = matches.filter(m => m.status !== "BYE");
  const completed = playable.filter(m => m.status === "COMPLETED" || m.status === "FORFEIT");

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ borderBottom: 1, borderColor: "divider", mb: 2, minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 600, fontSize: "0.875rem" } }}
      >
        <Tab label={`Partidos${playable.length > 0 ? ` (${completed.length}/${playable.length})` : ""}`} />
        <Tab label="Tabla de posiciones" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {matches.map(m => (
            <MatchCardComponent key={m.id} match={m} onEdit={() => onEditMatch(m)} />
          ))}
          {matches.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
              Los partidos aparecerán aquí tras generar los cruces.
            </Typography>
          )}
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <StandingsTable entries={standings} isTeamSport={isTeamSport} />
          <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 1 }}>
            Puntos: Victoria 3 pts · Empate 1 pt · Derrota 0 pts
          </Typography>
        </Box>
      )}
    </Box>
  );
}
