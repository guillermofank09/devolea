import { useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SchoolIcon from "@mui/icons-material/School";
import type { ProfesorBillingEntry } from "../../api/statsService";
import PageLoader from "../../components/common/PageLoader";

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

interface Props {
  data: ProfesorBillingEntry[];
  isLoading?: boolean;
  isError?: boolean;
}

export default function ProfesorBillingCard({ data, isLoading, isError }: Props) {
  const [search, setSearch] = useState("");

  const filtered = data.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalGanancia = filtered.reduce(
    (s, p) => s + p.classHourlyRate * p.monthlyHours,
    0
  );

  return (
    <Card elevation={0} sx={{ border: "1.5px solid", borderColor: "divider", borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2.5, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1, minWidth: 0 }}>
            <SchoolIcon sx={{ color: "#F5AD27", flexShrink: 0 }} />
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              Facturación por Profesor
            </Typography>
          </Box>
          {!isLoading && !isError && (
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
              Este mes · {fmt(totalGanancia)} ganancia club
            </Typography>
          )}
        </Box>

        {isLoading && <PageLoader />}

        {isError && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            No se pudieron cargar los datos de profesores.
          </Alert>
        )}

        {!isLoading && !isError && (
          <>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar profesor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ mb: 2, "& .MuiInputBase-root": { height: 38, fontSize: "0.875rem" } }}
            />

            {filtered.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  {data.length === 0
                    ? "No hay profesores registrados."
                    : "No se encontraron profesores con ese nombre."}
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Profesor</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Tarifa/h</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Clases</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.8rem" }}>Ganancia Club (mes)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((p) => {
                      const gananciaClub = p.classHourlyRate * p.monthlyHours;
                      return (
                        <TableRow key={p.profesorId} sx={{ "&:hover": { bgcolor: "action.hover" } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">{fmt(p.effectiveRate)}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{p.monthlyClasses}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={700} color="success.main">
                              {fmt(gananciaClub)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
