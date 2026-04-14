import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Fab,
  FormControl,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import IconButton from "@mui/material/IconButton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPlayers, deletePlayer } from "../../api/playerService";
import type { Player, PlayerCategory, PlayerSex } from "../../types/Player";
import PlayerTable, { CATEGORY_FULL, CATEGORY_LABEL, CATEGORY_ORDER } from "./PlayerTable";
import AddEditPlayer from "./AddEditPlayer";
import DeleteDialog from "../../components/common/DeleteDialog";
import PageHeader from "../../components/common/PageHeader";
import TableSkeleton from "../../components/common/TableSkeleton";

const ALL_CATEGORIES = (Object.keys(CATEGORY_ORDER) as PlayerCategory[]).sort(
  (a, b) => CATEGORY_ORDER[a] - CATEGORY_ORDER[b]
);

const selectSx = {
  borderRadius: 2,
  backgroundColor: "white",
};

export default function Players() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PlayerCategory | "">("");
  const [sexFilter, setSexFilter] = useState<PlayerSex | "">("");
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const { isPending, isFetching, error, data } = useQuery<Player[]>({
    queryKey: ["playersData", search],
    queryFn: () => fetchPlayers(search || undefined),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePlayer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playersData"] });
      setDeleteTarget(null);
    },
  });

  const handleEdit = (player: Player) => {
    setSelectedPlayer(player);
    setAddEditOpen(true);
  };

  const handleCloseForm = () => {
    setAddEditOpen(false);
    setSelectedPlayer(null);
  };

  // Only show categories that actually exist in the current dataset
  const availableCategories = data
    ? ALL_CATEGORIES.filter((cat) => data.some((p) => p.category === cat))
    : ALL_CATEGORIES;

  // Client-side filtering
  const filtered = (data ?? []).filter((p) => {
    const catMatch = categoryFilter === "" || p.category === categoryFilter;
    const sexMatch = sexFilter === "" || p.sex === sexFilter;
    return catMatch && sexMatch;
  });

  const hasActiveFilters = categoryFilter !== "" || sexFilter !== "";

  // Shared filter selects (used in both desktop and mobile)
  const categorySelect = (
    <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 150 }, flex: { xs: 1, sm: "none" }, "& .MuiOutlinedInput-root": selectSx }}>
      <Select
        value={categoryFilter}
        displayEmpty
        onChange={(e) => setCategoryFilter(e.target.value as PlayerCategory | "")}
        renderValue={(val) => val ? `${CATEGORY_LABEL[val]} — ${CATEGORY_FULL[val]}` : "Categoría"}
      >
        <MenuItem value="">Todas</MenuItem>
        {availableCategories.map((cat) => (
          <MenuItem key={cat} value={cat}>
            {CATEGORY_LABEL[cat]} — {CATEGORY_FULL[cat]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const sexSelect = (
    <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 130 }, flex: { xs: 1, sm: "none" }, "& .MuiOutlinedInput-root": selectSx }}>
      <Select
        value={sexFilter}
        displayEmpty
        onChange={(e) => setSexFilter(e.target.value as PlayerSex | "")}
        renderValue={(val) => val ? (val === "MASCULINO" ? "Masculino" : "Femenino") : "Sexo"}
      >
        <MenuItem value="">Todos</MenuItem>
        <MenuItem value="MASCULINO">Masculino</MenuItem>
        <MenuItem value="FEMENINO">Femenino</MenuItem>
      </Select>
    </FormControl>
  );

  // Desktop: search + filters + button in PageHeader
  const desktopAction = (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
      <OutlinedInput
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar jugador..."
        startAdornment={
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        }
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
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setAddEditOpen(true)}
        sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, whiteSpace: "nowrap" }}
      >
        Agregar jugador
      </Button>
    </Box>
  );

  return (
    <Box>
      <PageHeader
        title="Jugadores"
        subtitle="Gestioná los jugadores registrados en el club"
        action={isMobile ? undefined : desktopAction}
      />

      {/* Mobile: search + filters */}
      {isMobile && (
        <Box sx={{ mb: 2, mt: -2, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <OutlinedInput
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar jugador..."
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            }
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

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="default"
          aria-label="Agregar jugador"
          onClick={() => setAddEditOpen(true)}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            bgcolor: "#111",
            color: "#fff",
            "&:hover": { bgcolor: "#333" },
            zIndex: 1200,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {isPending && <TableSkeleton rows={7} columns={5} />}
      {error && <Alert severity="error">{String(error)}</Alert>}
      {data && (
        <>
          <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {filtered.length} {filtered.length === 1 ? "jugador" : "jugadores"}
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
          <PlayerTable
            players={filtered}
            onEdit={handleEdit}
            onDelete={(p) => setDeleteTarget(p)}
          />
        </>
      )}

      <AddEditPlayer
        open={addEditOpen}
        onClose={handleCloseForm}
        player={selectedPlayer}
      />

      <DeleteDialog
        open={!!deleteTarget}
        title="Eliminar jugador"
        description={`¿Estás seguro de que querés eliminar a ${deleteTarget?.name ?? "este jugador"}? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </Box>
  );
}
