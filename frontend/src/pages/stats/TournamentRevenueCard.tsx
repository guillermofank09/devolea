import { useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PageLoader from "../../components/common/PageLoader";
import type { TournamentRevenueEntry } from "../../api/statsService";
import { SPORT_LABEL } from "../../constants/sports";

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

const STATUS_LABEL: Record<string, { label: string; color: "default" | "success" | "warning" | "error" }> = {
  DRAFT:     { label: "Borrador",  color: "default"  },
  ACTIVE:    { label: "En Curso",  color: "success"  },
  COMPLETED: { label: "Finalizado", color: "warning" },
};

interface Props {
  data: TournamentRevenueEntry[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function TournamentRevenueCard({ data, isLoading, isError }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const totalNet = data.reduce((s, t) => s + t.net, 0);
  const totalIncome = data.reduce((s, t) => s + t.totalIncome, 0);
  const totalExpense = data.reduce((s, t) => s + t.totalExpense, 0);

  const cellSx = { fontSize: "0.8rem", py: 1 };
  const headerSx = { fontWeight: 700, fontSize: "0.78rem" };

  return (
    <Card elevation={0} sx={{ border: "1.5px solid", borderColor: "divider", borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { sm: "center" }, gap: { xs: 0.5, sm: 1.5 }, mb: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
            <EmojiEventsIcon sx={{ color: "#F5AD27", flexShrink: 0 }} />
            <Typography variant="subtitle1" fontWeight={700}>Recaudación por Torneo</Typography>
          </Box>
          {!isLoading && !isError && data.length > 0 && (
            <Box sx={{ display: "flex", gap: 2, pl: { xs: "36px", sm: 0 } }}>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" color="text.disabled" display="block">Ingresos totales</Typography>
                <Typography variant="caption" fontWeight={700} color="success.main">{fmt(totalIncome)}</Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" color="text.disabled" display="block">Egresos totales</Typography>
                <Typography variant="caption" fontWeight={700} color="error.main">{fmt(totalExpense)}</Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" color="text.disabled" display="block">Resultado</Typography>
                <Typography variant="caption" fontWeight={700} color={totalNet >= 0 ? "success.main" : "error.main"}>
                  {fmt(totalNet)}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {isLoading && <PageLoader />}
        {isError && <Alert severity="error" sx={{ borderRadius: 2 }}>No se pudieron cargar los datos de torneos.</Alert>}

        {!isLoading && !isError && data.length === 0 && (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">No hay torneos registrados.</Typography>
          </Box>
        )}

        {!isLoading && !isError && data.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={headerSx}>Torneo</TableCell>
                  <TableCell align="right" sx={headerSx}>Ingresos</TableCell>
                  <TableCell align="right" sx={headerSx}>Egresos</TableCell>
                  <TableCell align="right" sx={headerSx}>Resultado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map(t => {
                  const isOpen = expanded === t.tournamentId;
                  const st = STATUS_LABEL[t.status] ?? STATUS_LABEL.DRAFT;
                  return (
                    <>
                      <TableRow
                        key={t.tournamentId}
                        onClick={() => setExpanded(isOpen ? null : t.tournamentId)}
                        sx={{ cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                      >
                        <TableCell sx={cellSx}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <Typography variant="body2" fontWeight={600}>{t.name}</Typography>
                            <Chip label={st.label} color={st.color} size="small" sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700 }} />
                            {t.sport && (
                              <Typography variant="caption" color="text.disabled">
                                {SPORT_LABEL[t.sport as keyof typeof SPORT_LABEL] ?? t.sport}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={cellSx}>
                          <Typography variant="body2" color="success.main" fontWeight={600}>{fmt(t.totalIncome)}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={cellSx}>
                          <Typography variant="body2" color="error.main" fontWeight={600}>{fmt(t.totalExpense)}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={cellSx}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                            {t.net >= 0
                              ? <TrendingUpIcon sx={{ fontSize: 14, color: "success.main" }} />
                              : <TrendingDownIcon sx={{ fontSize: 14, color: "error.main" }} />}
                            <Typography variant="body2" fontWeight={700} color={t.net >= 0 ? "success.main" : "error.main"}>
                              {fmt(t.net)}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>

                      {isOpen && (
                        <TableRow key={`${t.tournamentId}-detail`}>
                          <TableCell colSpan={4} sx={{ py: 0, bgcolor: "#fafafa" }}>
                            <Box sx={{ px: 2, py: 1.5 }}>
                              <Divider sx={{ mb: 1.5 }} />
                              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 1.5 }}>
                                <Box>
                                  <Typography variant="caption" color="text.disabled" display="block">Inscripciones</Typography>
                                  <Typography variant="body2" fontWeight={600}>{t.inscriptions} × {fmt(t.inscriptionFee)}</Typography>
                                  <Typography variant="caption" color="success.main" fontWeight={700}>{fmt(t.totalInscriptions)}</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.disabled" display="block">Canchas (hs)</Typography>
                                  <Typography variant="body2" fontWeight={600}>{t.courtHours}h × {fmt(t.courtHourPrice)}</Typography>
                                  <Typography variant="caption" color="error.main" fontWeight={700}>{fmt(t.totalCourtCost)}</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.disabled" display="block">Premio</Typography>
                                  <Typography variant="caption" color="error.main" fontWeight={700}>{fmt(t.prize)}</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.disabled" display="block">Partidos programados</Typography>
                                  <Typography variant="body2" fontWeight={600}>{t.scheduledMatches}</Typography>
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
