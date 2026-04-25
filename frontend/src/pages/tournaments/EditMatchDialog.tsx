import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
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
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateMatch, createPlaceholderMatch, fetchMatchesByCourt } from "../../api/tournamentService";
import { fetchCourts } from "../../api/courtService";
import { fetchPlayers } from "../../api/playerService";
import type { Player } from "../../types/Player";
import type { Court } from "../../types/Court";
import { fetchBookingsByCourt } from "../../api/bookingService";
import { fetchSettings } from "../../api/settingsService";
import type { Pair, TournamentMatch, MatchLiveStatus, TournamentTeam, MatchGoal } from "../../types/Tournament";
import type { CalendarEvent } from "../../types/Event";
import type { Booking } from "../../types/Booking";
import { FORM_LABEL_SX } from "../../styles/formStyles";
import { useAuth } from "../../context/AuthContext";
import WeeklyCalendar from "../../components/calendar/weeklyCalendar";

interface SetScore { p1: string; p2: string; }

function parseResultToSets(result: string | null | undefined, count: number): SetScore[] {
  const parts = (result ?? "").trim().split(/\s+/).filter(Boolean);
  return Array.from({ length: count }, (_, i) => {
    const part = parts[i] ?? "";
    const [p1, p2] = part.split("-");
    return { p1: p1 ?? "", p2: p2 ?? "" };
  });
}

function composeSetsResult(sets: SetScore[]): string {
  return sets
    .filter(s => s.p1 !== "" || s.p2 !== "")
    .map(s => `${s.p1}-${s.p2}`)
    .join(" ");
}

function toLocalDatetimeParts(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function localToISO(localDatetime: string): string {
  return new Date(localDatetime).toISOString();
}

function formatSelected(localDatetime: string): string {
  const d = new Date(localDatetime);
  return d.toLocaleString("es-AR", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function calcWinnerFromSets(sets: SetScore[], p1Id: number | "", p2Id: number | ""): number | null {
  if (!p1Id || !p2Id) return null;
  const p1Wins = sets.filter(s => s.p1 !== "" && s.p2 !== "" && Number(s.p1) > Number(s.p2)).length;
  const p2Wins = sets.filter(s => s.p1 !== "" && s.p2 !== "" && Number(s.p2) > Number(s.p1)).length;
  if (p1Wins > p2Wins) return Number(p1Id);
  if (p2Wins > p1Wins) return Number(p2Id);
  return null;
}

function pairLabel(pair: Pair) {
  if (!pair.player2) return pair.player1.name;
  return `${pair.player1.name} / ${pair.player2.name}`;
}

function pairInitials(pair: Pair): string {
  const initials = (name: string) =>
    name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? "").join("");
  if (!pair.player2) return initials(pair.player1.name);
  return `${initials(pair.player1.name)} / ${initials(pair.player2.name)}`;
}

function getRoundLabel(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinales";
  if (fromEnd === 2) return "Cuartos de final";
  if (fromEnd === 3) return "Octavos de final";
  return `Ronda ${round}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  match: TournamentMatch;
  pairs: Pair[];
  teams?: TournamentTeam[];
  teamMode?: boolean;
  tournamentId: number;
  totalRounds?: number;
  sport?: string;
  tournamentStartDate?: string;
  tournamentEndDate?: string;
}

export default function EditMatchDialog({ open, onClose, match, pairs, teams = [], teamMode = false, tournamentId, totalRounds, sport, tournamentStartDate, tournamentEndDate }: Props) {
  const { user } = useAuth();
  const isFootball = sport?.startsWith("FUTBOL") ?? false;
  const isVirtual = match.id < 0;
  const isPlaceholder = isVirtual || (!match.pair1 && !match.pair2 && !match.team1 && !match.team2);

  const [scheduledAt, setScheduledAt] = useState("");
  const [courtId, setCourtId] = useState<number | "">("");
  const [pair1Id, setPair1Id] = useState<number | "">("");
  const [pair2Id, setPair2Id] = useState<number | "">("");
  const [team1Id, setTeam1Id] = useState<number | "">("");
  const [team2Id, setTeam2Id] = useState<number | "">("");
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [sets, setSets] = useState<SetScore[]>([{ p1: "", p2: "" }, { p1: "", p2: "" }, { p1: "", p2: "" }]);
  const [fbScore1, setFbScore1] = useState("");
  const [fbScore2, setFbScore2] = useState("");
  const [goals, setGoals] = useState<MatchGoal[]>([]);
  const [liveStatus, setLiveStatus] = useState<MatchLiveStatus | null>(null);
  const [delayedUntilTime, setDelayedUntilTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  // Two-column layout when a court is selected and not on mobile
  const sideLayout = !!courtId && !fullScreen;

  const { data: settings } = useQuery({
    queryKey: ["appSettings"],
    queryFn: fetchSettings,
    enabled: open,
  });
  const matchDuration = settings?.tournamentMatchDuration ?? 60;
  const setsCount = settings?.tournamentSetsCount ?? 3;

  const { data: allPlayers = [] } = useQuery<Player[]>({
    queryKey: ["playersData"],
    queryFn: () => fetchPlayers(),
    enabled: open && isFootball,
    staleTime: 60_000,
  });
  // Show football players first, then those without sport set
  const players = allPlayers
    .filter(p => !p.sports?.length || p.sports.includes("FUTBOL"))
    .sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (open) {
      const parts = toLocalDatetimeParts(match.scheduledAt);
      setScheduledAt(parts.date && parts.time ? `${parts.date}T${parts.time}` : "");
      setCourtId(match.court?.id ?? "");
      setPair1Id(match.pair1?.id ?? "");
      setPair2Id(match.pair2?.id ?? "");
      setTeam1Id(match.team1?.id ?? "");
      setTeam2Id(match.team2?.id ?? "");
      setWinnerId(match.winnerId ?? null);
      setSets(parseResultToSets(match.result, setsCount));
      if (isFootball) {
        const parts = (match.result ?? "").split("-");
        setFbScore1(parts[0] ?? "");
        setFbScore2(parts[1] ?? "");
        setGoals(match.goals ? [...match.goals] : []);
      }
      setLiveStatus(match.liveStatus ?? null);
      const delayedParts = toLocalDatetimeParts(match.delayedUntil);
      setDelayedUntilTime(delayedParts.time);
      setError(null);
    }
  }, [open, match, setsCount, isFootball]);

  const { data: allCourts = [] } = useQuery<Court[]>({
    queryKey: ["courtsData"],
    queryFn: () => fetchCourts(),
    enabled: open,
  });

  const multipleSports = (user?.sports ?? []).length > 1;
  const courts = sport && multipleSports
    ? allCourts.filter(c => {
        if (sport.startsWith("FUTBOL")) {
          return c.sport === "FUTBOL" && c.type === sport;
        }
        return c.sport === sport;
      })
    : allCourts;

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["bookingsByCourt", courtId],
    queryFn: () => fetchBookingsByCourt(Number(courtId)),
    enabled: open && !!courtId,
  });

  const { data: courtMatches = [] } = useQuery({
    queryKey: ["courtTournamentMatches", courtId],
    queryFn: () => fetchMatchesByCourt(Number(courtId)),
    enabled: open && !!courtId,
  });

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = bookings
      .filter(b => b.status !== "CANCELLED")
      .map(b => ({
        id: b.id,
        title: b.player?.name ?? b.profesor?.name ?? "Reservado",
        start: new Date(b.startTime),
        end: new Date(b.endTime),
        courtId: Number(courtId),
        status: "BOOKED" as const,
        color: "#9e9e9e",
        isRecurring: b.isRecurring,
        recurringGroupId: b.recurringGroupId,
      }));

    courtMatches
      .filter(m => m.id !== match.id && m.scheduledAt)
      .forEach(m => {
        const start = new Date(m.scheduledAt!);
        const end = new Date(start.getTime() + matchDuration * 60 * 1000);
        const p1 = m.pair1 ? `${m.pair1.player1.name.split(" ")[0]}${m.pair1.player2 ? "/" + m.pair1.player2.name.split(" ")[0] : ""}` : "?";
        const p2 = m.pair2 ? `${m.pair2.player1.name.split(" ")[0]}${m.pair2.player2 ? "/" + m.pair2.player2.name.split(" ")[0] : ""}` : "BYE";
        events.push({
          id: m.id,
          title: `Torneo: ${p1} vs ${p2}`,
          start,
          end,
          courtId: Number(courtId),
          status: "BOOKED",
          color: "#546e7a",
          isRecurring: false,
          recurringGroupId: null,
        });
      });

    if (scheduledAt) {
      const start = new Date(scheduledAt);
      const end = new Date(start.getTime() + matchDuration * 60 * 1000);
      events.push({
        id: -1,
        title: "Partido programado",
        start,
        end,
        courtId: Number(courtId),
        status: "BOOKED",
        color: "#1565c0",
        isRecurring: false,
        recurringGroupId: null,
      });
    }
    return events;
  }, [bookings, courtMatches, match.id, scheduledAt, courtId, matchDuration]);

  const calendarInitialDate = useMemo(() => {
    if (match.scheduledAt) return new Date(match.scheduledAt);
    return new Date();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.id, open]);

  const handleSlotSelect = (slotInfo: { start: Date }) => {
    const d = slotInfo.start;
    const pad = (n: number) => String(n).padStart(2, "0");
    setScheduledAt(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    );
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const scheduledAtISO = scheduledAt ? localToISO(scheduledAt) : null;
      const courtIdNum = courtId !== "" ? Number(courtId) : null;

      if (isVirtual) {
        const created = await createPlaceholderMatch(tournamentId, match.round, match.matchNumber);
        return updateMatch(created.id, { scheduledAt: scheduledAtISO, courtId: courtIdNum });
      }

      if (isPlaceholder) {
        // Only court + time — pairs are managed by the bracket engine
        return updateMatch(match.id, { scheduledAt: scheduledAtISO, courtId: courtIdNum });
      }

      // Build delayedUntil: combine scheduledAt date with the entered time
      let delayedUntilISO: string | null = null;
      if (liveStatus === "DELAYED" && delayedUntilTime) {
        const baseDateStr = scheduledAt ? scheduledAt.split("T")[0] : new Date().toISOString().split("T")[0];
        delayedUntilISO = localToISO(`${baseDateStr}T${delayedUntilTime}`);
      }

      const wasBye = match.status === "BYE";
      const pair2IsNowSet = teamMode ? (team2Id !== "" && team2Id != null) : (pair2Id !== "" && pair2Id != null);

      if (isFootball) {
        const s1 = parseInt(fbScore1) || 0;
        const s2 = parseInt(fbScore2) || 0;
        const fbResult = (fbScore1 !== "" || fbScore2 !== "") ? `${s1}-${s2}` : undefined;
        let fbWinnerId: number | null = winnerId ?? null;
        if (fbScore1 !== "" && fbScore2 !== "") {
          const t1Id = team1Id !== "" ? Number(team1Id) : null;
          const t2Id = team2Id !== "" ? Number(team2Id) : null;
          if (s1 > s2) fbWinnerId = t1Id;
          else if (s2 > s1) fbWinnerId = t2Id;
          else fbWinnerId = winnerId ?? null; // draw: keep manual selection
        }
        const fbStatus = fbWinnerId ? "COMPLETED" : wasBye && pair2IsNowSet ? "PENDING" : match.status;
        return updateMatch(match.id, {
          scheduledAt: scheduledAtISO,
          courtId: courtIdNum,
          team1Id: team1Id !== "" ? Number(team1Id) : null,
          team2Id: team2Id !== "" ? Number(team2Id) : null,
          winnerId: fbWinnerId,
          result: fbResult,
          goals: goals.length > 0 ? goals : null,
          status: fbStatus,
          liveStatus: liveStatus ?? null,
          delayedUntil: delayedUntilISO,
        });
      }

      const status = winnerId ? "COMPLETED" : wasBye && pair2IsNowSet ? "PENDING" : match.status;
      const result = composeSetsResult(sets);
      return updateMatch(match.id, {
        scheduledAt: scheduledAtISO,
        courtId: courtIdNum,
        ...(teamMode
          ? {
              team1Id: team1Id !== "" ? Number(team1Id) : null,
              team2Id: team2Id !== "" ? Number(team2Id) : null,
            }
          : {
              pair1Id: pair1Id !== "" ? Number(pair1Id) : null,
              pair2Id: pair2Id !== "" ? Number(pair2Id) : null,
            }),
        winnerId: winnerId ?? null,
        result: result || undefined,
        status,
        liveStatus: liveStatus ?? null,
        delayedUntil: delayedUntilISO,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentDetail", String(tournamentId)] });
      if (courtId !== "") {
        queryClient.invalidateQueries({ queryKey: ["courtTournamentMatches", Number(courtId)] });
      }
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error ?? "Error al actualizar el partido");
    },
  });

  const currentPair1 = pairs.find(p => p.id === Number(pair1Id)) ?? match.pair1;
  const currentPair2 = pairs.find(p => p.id === Number(pair2Id)) ?? match.pair2;
  const currentTeam1 = teams.find(t => t.id === Number(team1Id)) ?? match.team1;
  const currentTeam2 = teams.find(t => t.id === Number(team2Id)) ?? match.team2;
  const showWinner = teamMode ? (!!currentTeam1 && !!currentTeam2) : (!!currentPair1 && !!currentPair2);
  const missingSchedule = !isPlaceholder && (!courtId || !scheduledAt);

  // ── Controls panel (shared between side-layout and stacked) ────────────────
  const controlsPanel = (
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      gap: 2,
      p: 2.5,
      ...(sideLayout ? { width: 300, flexShrink: 0, overflowY: "auto" } : {}),
    }}>
      {isPlaceholder && (
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "grey.100" }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem" }}>
            Las parejas se asignarán cuando se complete la ronda anterior.
            Podés pre-programar cancha y horario.
          </Typography>
        </Box>
      )}

      {/* Court selector */}
      <Box>
        <FormLabel sx={FORM_LABEL_SX}>Cancha</FormLabel>
        <Select
          fullWidth
          size="small"
          value={courtId}
          onChange={e => {
            setCourtId(e.target.value as number | "");
            setScheduledAt("");
          }}
          displayEmpty
          sx={{ height: 40, fontSize: "0.875rem" }}
        >
          <MenuItem value=""><em>Sin cancha asignada</em></MenuItem>
          {courts.map(c => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Selected time */}
      {courtId ? (
        <Box>
          <FormLabel sx={{ ...FORM_LABEL_SX, display: "block", mb: 0.75 }}>Horario</FormLabel>
          {scheduledAt ? (
            <Chip
              label={formatSelected(scheduledAt)}
              color="primary"
              variant="outlined"
              onDelete={() => setScheduledAt("")}
              sx={{ fontWeight: 700, fontSize: "0.8rem", height: 32 }}
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              Hacé click en un horario libre del calendario →
            </Typography>
          )}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
          Seleccioná una cancha para ver su disponibilidad.
        </Typography>
      )}

      {/* Live status (non-placeholder matches with pairs or teams) */}
      {!isPlaceholder && (match.pair1 || match.pair2 || match.team1 || match.team2) && (
        <>
          <Divider />
          <Box>
            <FormLabel sx={{ ...FORM_LABEL_SX, display: "block", mb: 1 }}>Estado en vivo</FormLabel>
            <ToggleButtonGroup
              value={liveStatus}
              exclusive
              onChange={(_, val) => {
                setLiveStatus(val as MatchLiveStatus | null);
                if (val !== "DELAYED") setDelayedUntilTime("");
              }}
              size="small"
              fullWidth
              sx={{
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  borderColor: "divider",
                  flex: 1,
                  py: 0.75,
                },
                "& .MuiToggleButton-root[value='IN_PLAY'].Mui-selected": {
                  bgcolor: "#e8f5e9", color: "#2e7d32", borderColor: "#a5d6a7",
                },
                "& .MuiToggleButton-root[value='DELAYED'].Mui-selected": {
                  bgcolor: "#fff3e0", color: "#e65100", borderColor: "#ffcc80",
                },
                "& .MuiToggleButton-root[value='EARLY'].Mui-selected": {
                  bgcolor: "#e3f2fd", color: "#1565c0", borderColor: "#90caf9",
                },
              }}
            >
              <ToggleButton value="IN_PLAY">En juego</ToggleButton>
              <ToggleButton value="DELAYED">Atrasado</ToggleButton>
              <ToggleButton value="EARLY">Adelantado</ToggleButton>
            </ToggleButtonGroup>

            {liveStatus === "DELAYED" && (
              <Box sx={{ mt: 1.5 }}>
                <FormLabel sx={{ ...FORM_LABEL_SX, display: "block", mb: 0.75 }}>
                  Hora estimada de inicio
                </FormLabel>
                <TextField
                  type="time"
                  size="small"
                  fullWidth
                  value={delayedUntilTime}
                  onChange={e => setDelayedUntilTime(e.target.value)}
                  inputProps={{ step: 300 }}
                  sx={{ "& input": { fontSize: "0.875rem" } }}
                />
              </Box>
            )}
          </Box>
        </>
      )}

      {/* Pairs or Teams (non-placeholder) */}
      {!isPlaceholder && (
        <>
          <Divider />
          {teamMode ? (
            <>
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Equipo 1</FormLabel>
                <Select
                  fullWidth size="small" value={team1Id}
                  onChange={e => setTeam1Id(e.target.value as number | "")}
                  displayEmpty sx={{ height: 40, fontSize: "0.875rem" }}
                >
                  <MenuItem value=""><em>Sin equipo</em></MenuItem>
                  {teams.map(t => <MenuItem key={t.id} value={t.id}>{t.equipo.name}</MenuItem>)}
                </Select>
              </Box>
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Equipo 2</FormLabel>
                <Select
                  fullWidth size="small" value={team2Id}
                  onChange={e => setTeam2Id(e.target.value as number | "")}
                  displayEmpty sx={{ height: 40, fontSize: "0.875rem" }}
                >
                  <MenuItem value=""><em>Sin equipo</em></MenuItem>
                  {teams.map(t => <MenuItem key={t.id} value={t.id}>{t.equipo.name}</MenuItem>)}
                </Select>
              </Box>
            </>
          ) : (
            <>
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Pareja 1</FormLabel>
                <Select
                  fullWidth size="small" value={pair1Id}
                  onChange={e => setPair1Id(e.target.value as number | "")}
                  displayEmpty sx={{ height: 40, fontSize: "0.875rem" }}
                >
                  <MenuItem value=""><em>Sin pareja</em></MenuItem>
                  {pairs.map(p => <MenuItem key={p.id} value={p.id}>{pairLabel(p)}</MenuItem>)}
                </Select>
              </Box>
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Pareja 2</FormLabel>
                <Select
                  fullWidth size="small" value={pair2Id}
                  onChange={e => setPair2Id(e.target.value as number | "")}
                  displayEmpty sx={{ height: 40, fontSize: "0.875rem" }}
                >
                  <MenuItem value=""><em>Sin pareja</em></MenuItem>
                  {pairs.map(p => <MenuItem key={p.id} value={p.id}>{pairLabel(p)}</MenuItem>)}
                </Select>
              </Box>
            </>
          )}

          {missingSchedule && (
            <Alert severity="warning" sx={{ borderRadius: 2, fontSize: "0.82rem" }}>
              Asigná cancha y horario antes de cargar el resultado.
            </Alert>
          )}

          <Box sx={{ opacity: missingSchedule ? 0.4 : 1, pointerEvents: missingSchedule ? "none" : "auto" }}>
          {isFootball ? (
            <>
              {/* Football: score */}
              <Box>
                <FormLabel sx={{ ...FORM_LABEL_SX, display: "block", mb: 1 }}>Marcador</FormLabel>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ flex: 1, textAlign: "center" }}>
                    {currentTeam1 && (
                      <Typography variant="caption" color="text.secondary" fontWeight={700} noWrap sx={{ display: "block", mb: 0.5, fontSize: "0.72rem" }}>
                        {currentTeam1.equipo.name}
                      </Typography>
                    )}
                    <TextField
                      size="small"
                      type="number"
                      value={fbScore1}
                      onChange={e => setFbScore1(e.target.value)}
                      placeholder="0"
                      inputProps={{ min: 0, style: { textAlign: "center", padding: "8px", fontSize: "1.2rem", fontWeight: 700 } }}
                      sx={{ width: "100%" }}
                    />
                  </Box>
                  <Typography variant="h6" color="text.disabled" sx={{ flexShrink: 0, mt: currentTeam1 ? 2.5 : 0 }}>—</Typography>
                  <Box sx={{ flex: 1, textAlign: "center" }}>
                    {currentTeam2 && (
                      <Typography variant="caption" color="text.secondary" fontWeight={700} noWrap sx={{ display: "block", mb: 0.5, fontSize: "0.72rem" }}>
                        {currentTeam2.equipo.name}
                      </Typography>
                    )}
                    <TextField
                      size="small"
                      type="number"
                      value={fbScore2}
                      onChange={e => setFbScore2(e.target.value)}
                      placeholder="0"
                      inputProps={{ min: 0, style: { textAlign: "center", padding: "8px", fontSize: "1.2rem", fontWeight: 700 } }}
                      sx={{ width: "100%" }}
                    />
                  </Box>
                </Box>
                {/* Draw: manual winner */}
                {showWinner && fbScore1 !== "" && fbScore2 !== "" && parseInt(fbScore1) === parseInt(fbScore2) && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
                      Empate — seleccioná el ganador (penales/desempate):
                    </Typography>
                    <ToggleButtonGroup
                      value={winnerId} exclusive onChange={(_, val) => setWinnerId(val)}
                      size="small" fullWidth
                      sx={{
                        "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 600, fontSize: "0.78rem", borderColor: "divider" },
                        "& .MuiToggleButton-root.Mui-selected": { bgcolor: "#F5AD27", color: "#111", borderColor: "#F5AD27" },
                      }}
                    >
                      <ToggleButton value={currentTeam1!.id}>{currentTeam1!.equipo.name}</ToggleButton>
                      <ToggleButton value={currentTeam2!.id}>{currentTeam2!.equipo.name}</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                )}
              </Box>

              {/* Football: goal scorers */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                  <FormLabel sx={FORM_LABEL_SX}>Goles</FormLabel>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setGoals(prev => [...prev, { playerName: "", teamId: currentTeam1 ? currentTeam1.id : 0, minute: 0 }])}
                    sx={{ textTransform: "none", fontSize: "0.78rem" }}
                  >
                    Agregar gol
                  </Button>
                </Box>
                {goals.length === 0 && (
                  <Typography variant="caption" color="text.disabled">Sin goles registrados.</Typography>
                )}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {goals.map((goal, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Autocomplete
                        freeSolo
                        size="small"
                        options={players}
                        getOptionLabel={(opt) => typeof opt === "string" ? opt : opt.name}
                        inputValue={goal.playerName}
                        onInputChange={(_, value) =>
                          setGoals(prev => prev.map((g, idx) => idx === i ? { ...g, playerName: value } : g))
                        }
                        onChange={(_, value) => {
                          if (value && typeof value !== "string") {
                            setGoals(prev => prev.map((g, idx) => idx === i ? { ...g, playerName: value.name } : g));
                          }
                        }}
                        sx={{ flex: 1 }}
                        renderOption={(props, opt) => (
                          <li {...props} key={opt.id}>
                            <Typography variant="body2">{opt.name}</Typography>
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Jugador"
                            inputProps={{ ...params.inputProps, style: { fontSize: "0.85rem" } }}
                          />
                        )}
                      />
                      <Select
                        size="small"
                        value={goal.teamId || (currentTeam1?.id ?? 0)}
                        onChange={e => setGoals(prev => prev.map((g, idx) => idx === i ? { ...g, teamId: Number(e.target.value) } : g))}
                        sx={{ minWidth: 90, fontSize: "0.8rem" }}
                      >
                        {currentTeam1 && <MenuItem value={currentTeam1.id}>{currentTeam1.equipo.name}</MenuItem>}
                        {currentTeam2 && <MenuItem value={currentTeam2.id}>{currentTeam2.equipo.name}</MenuItem>}
                      </Select>
                      <TextField
                        size="small"
                        type="number"
                        value={goal.minute || ""}
                        onChange={e => setGoals(prev => prev.map((g, idx) => idx === i ? { ...g, minute: parseInt(e.target.value) || 0 } : g))}
                        placeholder="Min"
                        inputProps={{ min: 0, max: 120, style: { textAlign: "center", padding: "6px 4px", width: 44 } }}
                        sx={{ width: 60, flexShrink: 0 }}
                      />
                      <IconButton size="small" color="error" onClick={() => setGoals(prev => prev.filter((_, idx) => idx !== i))}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>
            </>
          ) : (
            <>
              <Box>
                <FormLabel sx={{ ...FORM_LABEL_SX, display: "block", mb: 1 }}>Resultado por set</FormLabel>
                {(teamMode ? (currentTeam1 && currentTeam2) : (currentPair1 && currentPair2)) && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                    <Typography variant="caption" sx={{ minWidth: 44 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={700}
                      sx={{ width: 56, textAlign: "center", fontSize: "0.7rem", flexShrink: 0 }}>
                      {teamMode ? currentTeam1?.equipo.name.substring(0, 8) : pairInitials(currentPair1!)}
                    </Typography>
                    <Box sx={{ width: 12 }} />
                    <Typography variant="caption" color="text.secondary" fontWeight={700}
                      sx={{ width: 56, textAlign: "center", fontSize: "0.7rem", flexShrink: 0 }}>
                      {teamMode ? currentTeam2?.equipo.name.substring(0, 8) : pairInitials(currentPair2!)}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {Array.from({ length: setsCount }, (_, i) => {
                    const p1Id = teamMode ? team1Id : pair1Id;
                    const p2Id = teamMode ? team2Id : pair2Id;
                    return (
                      <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ minWidth: 44 }}>
                          Set {i + 1}
                        </Typography>
                        <TextField
                          size="small" value={sets[i]?.p1 ?? ""}
                          onChange={e => {
                            const next = sets.map((s, idx) => idx === i ? { ...s, p1: e.target.value } : s);
                            setSets(next);
                            setWinnerId(calcWinnerFromSets(next, p1Id, p2Id));
                          }}
                          placeholder="0"
                          inputProps={{ style: { textAlign: "center", padding: "6px 8px" } }}
                          sx={{ width: 56, flexShrink: 0 }}
                        />
                        <Typography variant="body2" color="text.secondary">—</Typography>
                        <TextField
                          size="small" value={sets[i]?.p2 ?? ""}
                          onChange={e => {
                            const next = sets.map((s, idx) => idx === i ? { ...s, p2: e.target.value } : s);
                            setSets(next);
                            setWinnerId(calcWinnerFromSets(next, p1Id, p2Id));
                          }}
                          placeholder="0"
                          inputProps={{ style: { textAlign: "center", padding: "6px 8px" } }}
                          sx={{ width: 56, flexShrink: 0 }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {showWinner && (
                <Box>
                  <FormLabel sx={{ ...FORM_LABEL_SX, display: "block", mb: 1 }}>Ganador</FormLabel>
                  <ToggleButtonGroup
                    value={winnerId} exclusive onChange={(_, val) => setWinnerId(val)}
                    size="small" orientation="vertical" fullWidth
                    sx={{
                      "& .MuiToggleButton-root": {
                        textTransform: "none", fontWeight: 600, fontSize: "0.875rem",
                        borderColor: "divider", color: "text.secondary",
                        justifyContent: "flex-start", px: 2, py: 1.25,
                      },
                      "& .MuiToggleButton-root.Mui-selected": {
                        bgcolor: "#F5AD27", color: "#111", borderColor: "#F5AD27",
                        "&:hover": { bgcolor: "#e09b18" },
                      },
                    }}
                  >
                    {teamMode ? (
                      <>
                        <ToggleButton value={currentTeam1!.id}>{currentTeam1!.equipo.name}</ToggleButton>
                        <ToggleButton value={currentTeam2!.id}>{currentTeam2!.equipo.name}</ToggleButton>
                      </>
                    ) : (
                      <>
                        <ToggleButton value={currentPair1!.id}>{pairLabel(currentPair1!)}</ToggleButton>
                        <ToggleButton value={currentPair2!.id}>{pairLabel(currentPair2!)}</ToggleButton>
                      </>
                    )}
                  </ToggleButtonGroup>
                </Box>
              )}
            </>
          )}
          </Box>
        </>
      )}

      {error && <Typography variant="body2" color="error">{error}</Typography>}
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={sideLayout ? "lg" : "sm"}
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 3,
          ...(sideLayout && { height: "88vh" }),
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1, borderBottom: "1px solid", borderColor: "divider" }}>
        {isPlaceholder ? "Programar partido" : "Editar partido"} #{match.matchNumber} — {totalRounds ? getRoundLabel(match.round, totalRounds) : `Ronda ${match.round}`}
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          flex: 1,
          display: "flex",
          overflow: sideLayout ? "hidden" : "auto",
          flexDirection: sideLayout ? "row" : "column",
        }}
      >
        {/* Controls */}
        {sideLayout ? (
          <Box sx={{ borderRight: "1px solid", borderColor: "divider" }}>
            {controlsPanel}
          </Box>
        ) : (
          controlsPanel
        )}

        {/* Calendar */}
        {courtId && (
          <Box sx={{
            flex: sideLayout ? 1 : "none",
            height: sideLayout ? undefined : (fullScreen ? 300 : 400),
            flexShrink: 0,
            overflow: "hidden",
            borderTop: !sideLayout ? "1px solid" : "none",
            borderColor: "divider",
          }}>
            <WeeklyCalendar
              key={`${match.id}-${courtId}`}
              events={calendarEvents}
              onSelectSlot={handleSlotSelect as any}
              onSelectEvent={() => {}}
              initialDate={calendarInitialDate}
              height="100%"
              highlightedDateRange={
                tournamentStartDate && tournamentEndDate
                  ? { start: tournamentStartDate, end: tournamentEndDate }
                  : undefined
              }
            />
          </Box>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
        <Button onClick={onClose} fullWidth={fullScreen} sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          fullWidth={fullScreen}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          {mutation.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
