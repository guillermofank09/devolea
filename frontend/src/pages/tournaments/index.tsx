import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Select,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTournaments, deleteTournament } from "../../api/tournamentService";
import PageLoader from "../../components/common/PageLoader";
import EmptyState from "../../components/common/EmptyState";
import type { Tournament, TournamentCategory, TournamentSex } from "../../types/Tournament";
import PageHeader from "../../components/common/PageHeader";
import AddEditTournament from "./AddEditTournament";
import DeleteDialog from "../../components/common/DeleteDialog";

const CATEGORY_LABEL: Record<TournamentCategory, string> = {
  PRIMERA: "1ra", SEGUNDA: "2da", TERCERA: "3ra", CUARTA: "4ta",
  QUINTA: "5ta", SEXTA: "6ta", SEPTIMA: "7ma", SIN_CATEGORIA: "S/C",
};

const SEX_LABEL: Record<TournamentSex, string> = {
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

const CATEGORY_ORDER: TournamentCategory[] = [
  "PRIMERA", "SEGUNDA", "TERCERA", "CUARTA", "QUINTA", "SEXTA", "SEPTIMA", "SIN_CATEGORIA",
];

const selectSx = { borderRadius: 2, backgroundColor: "white" };

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(start)} → ${fmt(end)}`;
}

export default function Tournaments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Tournament | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<TournamentCategory | "">("");
  const [sexFilter, setSexFilter] = useState<TournamentSex | "">("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { isPending, isFetching, error, data } = useQuery<Tournament[]>({
    queryKey: ["tournamentsData"],
    queryFn: fetchTournaments,
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTournament(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tournamentsData"] });
      setDeleteTarget(null);
    },
  });

  const availableCategories = data
    ? CATEGORY_ORDER.filter((cat) => data.some((t) => t.category === cat))
    : CATEGORY_ORDER;

  const filtered = (data ?? []).filter((t) => {
    const nameMatch = search === "" || t.name.toLowerCase().includes(search.toLowerCase());
    const catMatch = categoryFilter === "" || t.category === categoryFilter;
    const sexMatch = sexFilter === "" || t.sex === sexFilter;
    return nameMatch && catMatch && sexMatch;
  });

  const hasActiveFilters = categoryFilter !== "" || sexFilter !== "";

  const categorySelect = (
    <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 150 }, flex: { xs: 1, sm: "none" }, "& .MuiOutlinedInput-root": selectSx }}>
      <Select
        value={categoryFilter}
        displayEmpty
        onChange={(e) => setCategoryFilter(e.target.value as TournamentCategory | "")}
        renderValue={(val) => val ? `Cat. ${CATEGORY_LABEL[val as TournamentCategory]}` : "Categoría"}
      >
        <MenuItem value="">Todas</MenuItem>
        {availableCategories.map((cat) => (
          <MenuItem key={cat} value={cat}>Cat. {CATEGORY_LABEL[cat]}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const sexSelect = (
    <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 130 }, flex: { xs: 1, sm: "none" }, "& .MuiOutlinedInput-root": selectSx }}>
      <Select
        value={sexFilter}
        displayEmpty
        onChange={(e) => setSexFilter(e.target.value as TournamentSex | "")}
        renderValue={(val) => val ? SEX_LABEL[val as TournamentSex] : "Sexo"}
      >
        <MenuItem value="">Todos</MenuItem>
        <MenuItem value="MASCULINO">Masculino</MenuItem>
        <MenuItem value="FEMENINO">Femenino</MenuItem>
        <MenuItem value="MIXTO">Mixto</MenuItem>
      </Select>
    </FormControl>
  );

  const addButton = (
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={() => setAddOpen(true)}
      sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, whiteSpace: "nowrap" }}
    >
      Agregar torneo
    </Button>
  );

  const desktopAction = (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
      <OutlinedInput
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar torneo..."
        startAdornment={<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>}
        endAdornment={
          search ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setSearch("")} edge="end" aria-label="Limpiar búsqueda">
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null
        }
        sx={{ borderRadius: 2, backgroundColor: "white", minWidth: 200 }}
      />
      {categorySelect}
      {sexSelect}
      {addButton}
    </Box>
  );

  return (
    <Box>
      <PageHeader
        title="Torneos"
        subtitle="Administrá los torneos del club"
        action={isMobile ? addButton : desktopAction}
      />

      {/* Mobile: search + filters */}
      {isMobile && (
        <Box sx={{ mb: 2, mt: -2, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <OutlinedInput
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar torneo..."
            startAdornment={<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>}
            endAdornment={
              search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch("")} edge="end" aria-label="Limpiar búsqueda">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
            sx={{ borderRadius: 2, backgroundColor: "white" }}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            {categorySelect}
            {sexSelect}
          </Box>
        </Box>
      )}

      {isPending && <PageLoader />}
      {error && <Alert severity="error">{String(error)}</Alert>}

      {data && (
        <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            {filtered.length} {filtered.length === 1 ? "torneo" : "torneos"}
            {filtered.length !== data.length && (
              <> · <span style={{ color: "#aaa" }}>{data.length} en total</span></>
            )}
          </Typography>
          {isFetching && !isPending && <CircularProgress size={14} sx={{ color: "text.disabled" }} />}
          {hasActiveFilters && (
            <Typography
              variant="caption"
              color="text.disabled"
              onClick={() => { setCategoryFilter(""); setSexFilter(""); }}
              sx={{ cursor: "pointer", "&:hover": { color: "text.secondary" } }}
            >
              Limpiar filtros
            </Typography>
          )}
        </Box>
      )}

      {data && data.length === 0 && (
        <EmptyState
          message="Todavía no hay torneos registrados. Agregá el primero."
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              Agregar torneo
            </Button>
          }
        />
      )}

      {data && data.length > 0 && filtered.length === 0 && (
        <EmptyState message="No hay torneos que coincidan con los filtros aplicados." />
      )}

      {data && filtered.length > 0 && (
        <Grid container spacing={2}>
          {filtered.map(tournament => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tournament.id}>
              <Card
                sx={{
                  borderRadius: 2,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                  "&:hover": { boxShadow: 4 },
                }}
                onClick={() => navigate(`/tournaments/${tournament.id}`)}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, flex: 1, mr: 1 }}>
                      {tournament.name}
                    </Typography>
                    <Tooltip title="Eliminar torneo">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteTarget(tournament);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                    <Chip
                      label={`Cat. ${CATEGORY_LABEL[tournament.category]}`}
                      size="small"
                      color="info"
                      sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                    />
                    {tournament.sex && (
                      <Chip
                        label={SEX_LABEL[tournament.sex] ?? tournament.sex}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                      />
                    )}
                    <Chip
                      label={getDateStatus(tournament.startDate, tournament.endDate).label}
                      size="small"
                      color={getDateStatus(tournament.startDate, tournament.endDate).color}
                      sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                    />
                    {tournament.format && (
                      <Chip
                        label={tournament.format === "ROUND_ROBIN" ? "Round Robin" : "Llaves"}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                      />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {formatDateRange(tournament.startDate, tournament.endDate)}
                  </Typography>
                </CardContent>

                <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={e => {
                      e.stopPropagation();
                      navigate(`/tournaments/${tournament.id}`);
                    }}
                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: 1.5 }}
                  >
                    Ver detalle
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <AddEditTournament open={addOpen} onClose={() => setAddOpen(false)} />
      <AddEditTournament open={!!editTarget} onClose={() => setEditTarget(null)} tournament={editTarget} />
      <DeleteDialog
        open={!!deleteTarget}
        title="Eliminar torneo"
        description={`¿Estás seguro de que querés eliminar el torneo "${deleteTarget?.name ?? ""}"? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </Box>
  );
}
