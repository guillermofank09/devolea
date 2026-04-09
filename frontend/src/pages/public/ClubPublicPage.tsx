import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import type { TournamentMatch, Pair, TournamentDetail } from "../../types/Tournament";
import { fetchPublicProfile, fetchPublicTournaments, fetchPublicTournamentDetail } from "../../api/publicService";

// ─── constants ──────────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  PRIMERA: "1ra", SEGUNDA: "2da", TERCERA: "3ra", CUARTA: "4ta",
  QUINTA: "5ta", SEXTA: "6ta", SEPTIMA: "7ma", SIN_CATEGORIA: "Sin categoría",
};

const FORMAT_LABEL: Record<string, string> = {
  ROUND_ROBIN: "Round Robin",
  BRACKET: "Llaves",
};

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: "En curso",     color: "#1b5e20", bg: "#e8f5e9" },
  DRAFT:  { label: "Por comenzar", color: "#0d47a1", bg: "#e3f2fd" },
};

// Gradient banner per tournament — cycles through a palette
const BANNER_GRADIENTS = [
  "linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)",
  "linear-gradient(135deg, #6a1b9a 0%, #ce93d8 100%)",
  "linear-gradient(135deg, #e65100 0%, #ffb74d 100%)",
  "linear-gradient(135deg, #1b5e20 0%, #66bb6a 100%)",
  "linear-gradient(135deg, #880e4f 0%, #f48fb1 100%)",
  "linear-gradient(135deg, #004d40 0%, #4db6ac 100%)",
];

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// ─── helpers ─────────────────────────────────────────────────────────────────

function pairLabel(pair: Pair | null | undefined): string {
  if (!pair) return "BYE";
  return `${pair.player1.name.split(" ")[0]} / ${pair.player2.name.split(" ")[0]}`;
}

function getRoundLabel(roundNumber: number, totalRounds: number): string {
  const fromEnd = totalRounds - roundNumber;
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinales";
  if (fromEnd === 2) return "Cuartos de final";
  if (fromEnd === 3) return "Octavos de final";
  return `Ronda ${roundNumber}`;
}

// ─── live status colors ───────────────────────────────────────────────────────

const LIVE_STATUS_COLORS: Record<string, { stripe: string; border: string; bg: string; text: string; label: string }> = {
  IN_PLAY: { stripe: "#4caf50", border: "#a5d6a7", bg: "#f1f8f1", text: "#2e7d32", label: "En juego" },
  DELAYED:  { stripe: "#ff9800", border: "#ffcc80", bg: "#fff8f0", text: "#e65100", label: "Atrasado" },
  EARLY:    { stripe: "#29b6f6", border: "#90caf9", bg: "#f0f8ff", text: "#1565c0", label: "Adelantado" },
};

// ─── read-only bracket ────────────────────────────────────────────────────────

const MATCH_H = 84;
const MATCH_W = 210;
const CONN_W = 48;
const GAP_1 = 16;
const STROKE = "#d0d0d0";

function ReadOnlyBracket({ matches }: { matches: TournamentMatch[] }) {
  const bracketMatches = matches.filter(m => !m.isRepechage);

  const matchesByRound: Record<number, TournamentMatch[]> = {};
  bracketMatches.forEach(m => {
    if (!matchesByRound[m.round]) matchesByRound[m.round] = [];
    matchesByRound[m.round].push(m);
  });

  const generatedRounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  if (!generatedRounds.length) return null;

  const round1Count = matchesByRound[generatedRounds[0]].length;
  const allRoundCounts: number[] = [round1Count];
  let remaining = round1Count;
  while (remaining > 1) { remaining = Math.ceil(remaining / 2); allRoundCounts.push(remaining); }
  const totalRounds = allRoundCounts.length;
  const allRoundNums = Array.from({ length: totalRounds }, (_, i) => i + 1);

  const unifiedByRound: Record<number, (TournamentMatch | { virtual: true; round: number; matchNumber: number })[]> = {};
  allRoundNums.forEach((rn, ri) => {
    unifiedByRound[rn] = matchesByRound[rn] ?? Array.from({ length: allRoundCounts[ri] }, (_, i) => ({ virtual: true as const, round: rn, matchNumber: i + 1 }));
  });

  const posMap = new Map<string, number>();
  const span0 = MATCH_H + GAP_1;
  unifiedByRound[1].forEach((_, i) => posMap.set(`1-${i}`, MATCH_H / 2 + i * span0));
  for (let ri = 1; ri < allRoundNums.length; ri++) {
    const prev = allRoundNums[ri - 1];
    const curr = allRoundNums[ri];
    unifiedByRound[curr].forEach((_, i) => {
      const cy1 = posMap.get(`${prev}-${2 * i}`) ?? 0;
      const cy2 = posMap.get(`${prev}-${2 * i + 1}`);
      posMap.set(`${curr}-${i}`, cy2 != null ? (cy1 + cy2) / 2 : cy1);
    });
  }

  const allCenters = Array.from(posMap.values());
  const totalH = Math.max(...allCenters) + MATCH_H / 2;
  const totalW = totalRounds * MATCH_W + (totalRounds - 1) * CONN_W;

  const connectors: React.ReactNode[] = [];
  allRoundNums.forEach((round, ri) => {
    if (ri >= totalRounds - 1) return;
    const nextRound = allRoundNums[ri + 1];
    const slots = unifiedByRound[round];
    const x1 = ri * (MATCH_W + CONN_W) + MATCH_W;
    const xMid = x1 + CONN_W / 2;
    const x2 = x1 + CONN_W;
    for (let i = 0; i < slots.length; i += 2) {
      const cy1 = posMap.get(`${round}-${i}`)!;
      const cyNext = posMap.get(`${nextRound}-${Math.floor(i / 2)}`)!;
      connectors.push(<line key={`ha-${round}-${i}`} x1={x1} y1={cy1} x2={xMid} y2={cy1} stroke={STROKE} strokeWidth={1.5} strokeLinecap="round" />);
      if (i + 1 < slots.length) {
        const cy2 = posMap.get(`${round}-${i + 1}`)!;
        connectors.push(
          <line key={`ha2-${round}-${i}`} x1={x1} y1={cy2} x2={xMid} y2={cy2} stroke={STROKE} strokeWidth={1.5} strokeLinecap="round" />,
          <line key={`v-${round}-${i}`} x1={xMid} y1={cy1} x2={xMid} y2={cy2} stroke={STROKE} strokeWidth={1.5} strokeLinecap="round" />,
          <line key={`hb-${round}-${i}`} x1={xMid} y1={(cy1 + cy2) / 2} x2={x2} y2={cyNext} stroke={STROKE} strokeWidth={1.5} strokeLinecap="round" />,
        );
      } else {
        connectors.push(<line key={`hb-${round}-${i}`} x1={xMid} y1={cy1} x2={x2} y2={cyNext} stroke={STROKE} strokeWidth={1.5} strokeLinecap="round" />);
      }
    }
  });

  const lastRound = generatedRounds[generatedRounds.length - 1];
  const finalMatches = matchesByRound[lastRound];
  let champion: Pair | null = null;
  if (lastRound === totalRounds && finalMatches?.length === 1 && finalMatches[0].winnerId != null) {
    const fm = finalMatches[0];
    champion = fm.pair1?.id === fm.winnerId ? (fm.pair1 ?? null) : (fm.pair2 ?? null);
  }

  return (
    <Box sx={{ overflowX: "auto", pb: 2, WebkitOverflowScrolling: "touch" }}>
      <Box sx={{ display: "flex", mb: 2, minWidth: totalW }}>
        {allRoundNums.map((round, ri) => (
          <Box key={round} sx={{ width: MATCH_W, flexShrink: 0, textAlign: "center", mr: ri < allRoundNums.length - 1 ? `${CONN_W}px` : 0 }}>
            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1.2, fontSize: "0.68rem" }}>
              {getRoundLabel(round, totalRounds)}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ position: "relative", width: totalW, height: totalH, minWidth: totalW }}>
        <svg style={{ position: "absolute", top: 0, left: 0, width: totalW, height: totalH, pointerEvents: "none", overflow: "visible" }}>
          {connectors}
        </svg>
        {allRoundNums.map((round, ri) =>
          unifiedByRound[round].map((slot, mi) => {
            const cy = posMap.get(`${round}-${mi}`)!;
            const isVirt = "virtual" in slot;
            return (
              <Box key={isVirt ? `v-${round}-${mi}` : (slot as TournamentMatch).id} sx={{ position: "absolute", top: cy - MATCH_H / 2, left: ri * (MATCH_W + CONN_W), width: MATCH_W, height: MATCH_H }}>
                {isVirt ? <EmptyCard /> : <PublicMatchCard match={slot as TournamentMatch} />}
              </Box>
            );
          })
        )}
      </Box>
      {champion && (
        <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 2, px: 3, py: 1.5, bgcolor: "#fffbeb", border: "2px solid #f59e0b", borderRadius: 3 }}>
            <EmojiEventsIcon sx={{ color: "#f59e0b", fontSize: 36 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 1.2, display: "block" }}>Campeón</Typography>
              <Typography variant="subtitle1" fontWeight={800} lineHeight={1.3}>{champion.player1.name} / {champion.player2.name}</Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function EmptyCard() {
  return (
    <Paper elevation={0} sx={{ width: "100%", height: "100%", border: "1.5px dashed", borderColor: "divider", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.45 }}>
      <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.7rem" }}>A definir</Typography>
    </Paper>
  );
}

function PublicMatchCard({ match }: { match: TournamentMatch }) {
  const isBye = match.status === "BYE";
  const isCompleted = match.status === "COMPLETED";
  const pair1Won = match.winnerId != null && match.pair1?.id === match.winnerId;
  const pair2Won = match.winnerId != null && match.pair2?.id === match.winnerId;
  const live = match.liveStatus ? LIVE_STATUS_COLORS[match.liveStatus] : null;
  const sideColor = live ? live.stripe : isBye ? "#90caf9" : isCompleted ? "#66bb6a" : "#bdbdbd";
  const isPlaceholder = !match.pair1 && !match.pair2;

  return (
    <Paper elevation={0} sx={{ width: "100%", height: "100%", border: "1.5px solid", borderColor: live ? live.border : isCompleted ? "#c8e6c9" : "divider", bgcolor: live ? live.bg : "background.paper", borderRadius: 2, overflow: "hidden", display: "flex" }}>
      <Box sx={{ width: 4, flexShrink: 0, bgcolor: sideColor }} />
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <PublicPairRow label={isPlaceholder ? "A definir" : pairLabel(match.pair1)} isWinner={pair1Won} isLoser={pair2Won} isPlaceholder={isPlaceholder} />
        <Box sx={{ height: "1px", bgcolor: live ? live.border : "divider", flexShrink: 0 }} />
        <PublicPairRow label={isPlaceholder ? "A definir" : pairLabel(match.pair2)} isWinner={pair2Won} isLoser={pair1Won} isPlaceholder={isPlaceholder} />
        <Box sx={{ height: "1px", bgcolor: live ? live.border : "divider", flexShrink: 0 }} />
        <Box sx={{ flexShrink: 0, height: 16, display: "flex", alignItems: "center", justifyContent: "center", px: 1, bgcolor: live ? live.bg : "grey.50" }}>
          {match.result ? (
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ fontSize: "0.62rem" }}>{match.result}</Typography>
          ) : live ? (
            <Typography variant="caption" fontWeight={700} sx={{ fontSize: "0.6rem", color: live.text }}>
              {live.label}{match.liveStatus === "DELAYED" && match.delayedUntil ? ` · ${new Date(match.delayedUntil).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : ""}
            </Typography>
          ) : match.scheduledAt ? (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem" }}>
              {new Date(match.scheduledAt).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              {match.court?.name ? ` · ${match.court.name}` : ""}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Paper>
  );
}

function PublicPairRow({ label, isWinner, isLoser, isPlaceholder }: { label: string; isWinner: boolean; isLoser: boolean; isPlaceholder: boolean }) {
  return (
    <Box sx={{ flex: 1, display: "flex", alignItems: "center", px: 1, gap: 0.5, bgcolor: isWinner ? "rgba(76,175,80,0.10)" : "transparent", minWidth: 0 }}>
      {isWinner ? <EmojiEventsIcon sx={{ fontSize: 11, color: "#f59e0b", flexShrink: 0 }} /> : <Box sx={{ width: 11, flexShrink: 0 }} />}
      <Typography variant="caption" noWrap sx={{ flex: 1, fontSize: "0.7rem", fontWeight: isWinner ? 700 : 400, color: isPlaceholder ? "text.disabled" : isLoser ? "text.disabled" : "text.primary", minWidth: 0 }}>
        {label}
      </Typography>
    </Box>
  );
}

// ─── round-robin match list ───────────────────────────────────────────────────

function RoundRobinList({ matches }: { matches: TournamentMatch[] }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {matches.map(m => {
        const live = m.liveStatus ? LIVE_STATUS_COLORS[m.liveStatus] : null;
        const isCompleted = m.status === "COMPLETED";
        return (
          <Paper key={m.id} elevation={0} sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: live ? live.border : isCompleted ? "#c8e6c9" : "divider", bgcolor: live ? live.bg : "background.paper", display: "flex" }}>
            <Box sx={{ width: 4, flexShrink: 0, bgcolor: live ? live.stripe : isCompleted ? "#66bb6a" : "#bdbdbd" }} />
            <Box sx={{ flex: 1, p: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="body2" sx={{ flex: 1, minWidth: 120 }}>
                  <strong>{pairLabel(m.pair1)}</strong>
                  <Typography component="span" variant="caption" color="text.secondary" mx={0.75}>vs</Typography>
                  <strong>{pairLabel(m.pair2)}</strong>
                </Typography>
                {m.result && (
                  <Typography variant="caption" fontWeight={700} color="success.main">{m.result}</Typography>
                )}
                {live && !m.result && (
                  <Typography variant="caption" fontWeight={700} sx={{ color: live.text }}>
                    {live.label}{m.liveStatus === "DELAYED" && m.delayedUntil ? ` · ${new Date(m.delayedUntil).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : ""}
                  </Typography>
                )}
                {!live && m.scheduledAt && !m.result && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(m.scheduledAt).toLocaleString("es-AR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    {m.court?.name ? ` · ${m.court.name}` : ""}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}

// ─── tournament card ──────────────────────────────────────────────────────────

function TournamentCard({ username, tournament, gradientIndex }: { username: string; tournament: { id: number; name: string; startDate: string; endDate: string; category: string; format?: string; status: string }; gradientIndex: number }) {
  const { data, isLoading } = useQuery<TournamentDetail>({
    queryKey: ["publicTournamentDetail", username, tournament.id],
    queryFn: () => fetchPublicTournamentDetail(username, tournament.id),
  });

  const statusInfo = STATUS_INFO[tournament.status] ?? { label: tournament.status, color: "#555", bg: "#f5f5f5" };
  const gradient = BANNER_GRADIENTS[gradientIndex % BANNER_GRADIENTS.length];
  const isBracket = data?.format === "BRACKET";
  const hasMatches = (data?.matches.length ?? 0) > 0;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
      {/* Banner */}
      <Box sx={{ background: gradient, px: 3, py: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#fff" lineHeight={1.2} sx={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
              {tournament.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, display: "block" }}>
              {new Date(tournament.startDate).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
              {" — "}
              {new Date(tournament.endDate).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", alignItems: "center" }}>
            <Chip
              label={statusInfo.label}
              size="small"
              sx={{ height: 22, fontSize: "0.7rem", fontWeight: 700, bgcolor: statusInfo.bg, color: statusInfo.color, border: "none" }}
            />
            <Chip
              label={CATEGORY_LABEL[tournament.category] ?? tournament.category}
              size="small"
              sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600, bgcolor: "rgba(255,255,255,0.20)", color: "#fff" }}
            />
            {tournament.format && (
              <Chip
                label={FORMAT_LABEL[tournament.format] ?? tournament.format}
                size="small"
                sx={{ height: 22, fontSize: "0.7rem", bgcolor: "rgba(255,255,255,0.15)", color: "#fff" }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Fixture */}
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {isLoading && (
          <Box sx={{ py: 3, display: "flex", justifyContent: "center" }}><CircularProgress size={22} /></Box>
        )}
        {!isLoading && data && !hasMatches && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={data.pairs.length > 0 ? 1.5 : 0}>
              {data.pairs.length === 0 ? "El torneo aún no tiene parejas inscriptas." : "El fixture aún no fue generado."}
            </Typography>
            {data.pairs.length > 0 && (
              <>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                  Parejas inscriptas
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                  {data.pairs.map(p => (
                    <Chip key={p.id} size="small" label={`${p.player1.name} / ${p.player2.name}`} variant="outlined" />
                  ))}
                </Box>
              </>
            )}
          </Box>
        )}
        {!isLoading && data && hasMatches && (
          isBracket
            ? <ReadOnlyBracket matches={data.matches} />
            : <RoundRobinList matches={data.matches} />
        )}
      </Box>
    </Paper>
  );
}

// ─── sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  clubName: string;
  address?: string;
  logoBase64?: string | null;
  mapUrl: string | null;
  businessHours: Array<{ day: string; isOpen?: boolean; openTime?: string; closeTime?: string }>;
}

function ClubSidebar({ clubName, address, logoBase64, mapUrl, businessHours }: SidebarProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Club identity */}
      <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: "1px solid", borderColor: "divider" }}>
        {logoBase64 && (
          <Box
            component="img"
            src={logoBase64}
            alt="logo"
            sx={{ width: 72, height: 72, borderRadius: 2, objectFit: "contain", border: "1px solid", borderColor: "divider", display: "block", mb: 2 }}
          />
        )}
        <Typography variant="h5" fontWeight={800} lineHeight={1.2} mb={address ? 0.75 : 0}>
          {clubName || "Club de Pádel"}
        </Typography>
        {address && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
            <LocationOnIcon sx={{ fontSize: 16, color: "text.secondary", mt: "2px", flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary">{address}</Typography>
          </Box>
        )}
      </Paper>

      {/* Map */}
      {mapUrl && (
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "divider", height: 220 }}>
          <Box
            component="iframe"
            src={mapUrl}
            title="Ubicación del club"
            sx={{ width: "100%", height: "100%", border: 0, display: "block" }}
            loading="lazy"
          />
        </Paper>
      )}

      {/* Business hours */}
      {businessHours.length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <AccessTimeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <Typography variant="subtitle1" fontWeight={700}>Horarios</Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {DAYS.map(day => {
              const schedule = businessHours.find(h => h.day === day);
              const isOpen = schedule?.isOpen;
              return (
                <Box key={day} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.75, borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: 0, pb: 0 } }}>
                  <Typography variant="body2" fontWeight={isOpen ? 600 : 400} color={isOpen ? "text.primary" : "text.disabled"}>
                    {day}
                  </Typography>
                  {isOpen ? (
                    <Typography variant="body2" color="text.secondary">
                      {schedule!.openTime} – {schedule!.closeTime}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.disabled" sx={{ fontSize: "0.78rem" }}>
                      Cerrado
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}
    </Box>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ClubPublicPage() {
  const { username } = useParams<{ username: string }>();

  const { data: profile, isLoading: profileLoading, isError: profileError } = useQuery({
    queryKey: ["publicProfile", username],
    queryFn: () => fetchPublicProfile(username!),
    enabled: !!username,
    retry: false,
  });

  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery({
    queryKey: ["publicTournaments", username],
    queryFn: () => fetchPublicTournaments(username!),
    enabled: !!username,
  });

  if (profileLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (profileError || !profile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" fontWeight={700} mb={1}>Club no encontrado</Typography>
          <Typography color="text.secondary">No existe un club con ese nombre de usuario.</Typography>
        </Box>
      </Box>
    );
  }

  const mapUrl = profile.latitude && profile.longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${profile.longitude - 0.006}%2C${profile.latitude - 0.004}%2C${profile.longitude + 0.006}%2C${profile.latitude + 0.004}&layer=mapnik&marker=${profile.latitude}%2C${profile.longitude}`
    : null;

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", py: { xs: 3, md: 5 } }}>
      <Container maxWidth="xl">
        <Grid container spacing={3} alignItems="flex-start">

          {/* ── Main: tournaments ─────────────────────────── */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
              <SportsTennisIcon sx={{ color: "primary.main", fontSize: 26 }} />
              <Typography variant="h5" fontWeight={800}>Torneos</Typography>
            </Box>

            {tournamentsLoading && (
              <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}><CircularProgress size={28} /></Box>
            )}

            {!tournamentsLoading && tournaments.length === 0 && (
              <Paper elevation={0} sx={{ borderRadius: 3, p: 4, textAlign: "center", border: "1px solid", borderColor: "divider" }}>
                <Typography variant="body1" color="text.secondary">No hay torneos activos en este momento.</Typography>
              </Paper>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {tournaments.map((t, idx) => (
                <TournamentCard key={t.id} username={username!} tournament={t} gradientIndex={idx} />
              ))}
            </Box>
          </Grid>

          {/* ── Sidebar: club info ────────────────────────── */}
          <Grid item xs={12} md={4}>
            <ClubSidebar
              clubName={profile.clubName}
              address={profile.address}
              logoBase64={profile.logoBase64}
              mapUrl={mapUrl}
              businessHours={profile.businessHours}
            />
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}
