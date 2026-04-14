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
import { fetchProfesores, deleteProfesor } from "../../api/profesorService";
import TableSkeleton from "../../components/common/TableSkeleton";
import type { Profesor, ProfesorSex } from "../../types/Profesor";
import ProfesorTable from "./ProfesorTable";
import AddEditProfesor from "./AddEditProfesor";
import ProfesorScheduleModal from "./ProfesorScheduleModal";
import DeleteConfirmation from "../courts/DeleteCourt";
import PageHeader from "../../components/common/PageHeader";

const selectSx = { borderRadius: 2, backgroundColor: "white" };

export default function Profesores() {
  const [search, setSearch] = useState("");
  const [sexFilter, setSexFilter] = useState<ProfesorSex | "">("");
  const [addEditOpen, setAddEditOpen] = useState(false);
  const [selected, setSelected] = useState<Profesor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profesor | null>(null);
  const [scheduleProfesor, setScheduleProfesor] = useState<Profesor | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const { isPending, isFetching, error, data } = useQuery<Profesor[]>({
    queryKey: ["profesoresData", search],
    queryFn: () => fetchProfesores(search || undefined),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProfesor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profesoresData"] });
      setDeleteTarget(null);
    },
  });

  const handleEdit = (p: Profesor) => { setSelected(p); setAddEditOpen(true); };
  const handleCloseForm = () => { setAddEditOpen(false); setSelected(null); };

  const filtered = (data ?? []).filter((p) =>
    sexFilter === "" || p.sex === sexFilter
  );

  const sexSelect = (
    <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 130 }, flex: { xs: 1, sm: "none" }, "& .MuiOutlinedInput-root": selectSx }}>
      <Select
        value={sexFilter}
        displayEmpty
        onChange={(e) => setSexFilter(e.target.value as ProfesorSex | "")}
        renderValue={(val) => val ? (val === "MASCULINO" ? "Masculino" : "Femenino") : "Sexo"}
      >
        <MenuItem value="">Todos</MenuItem>
        <MenuItem value="MASCULINO">Masculino</MenuItem>
        <MenuItem value="FEMENINO">Femenino</MenuItem>
      </Select>
    </FormControl>
  );

  const desktopAction = (
    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
      <OutlinedInput
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar profesor..."
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
      {sexSelect}
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setAddEditOpen(true)}
        sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, whiteSpace: "nowrap" }}
      >
        Agregar profesor
      </Button>
    </Box>
  );

  return (
    <Box>
      <PageHeader
        title="Profesores"
        subtitle="Gestioná los profesores del club y sus horarios de clases"
        action={isMobile ? undefined : desktopAction}
      />

      {/* Mobile: search + filter */}
      {isMobile && (
        <Box sx={{ mb: 2, mt: -2, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <OutlinedInput
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar profesor..."
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
            {sexSelect}
          </Box>
        </Box>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          aria-label="Agregar profesor"
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

      {isPending && <TableSkeleton rows={5} columns={4} />}
      {error && <Alert severity="error">{String(error)}</Alert>}
      {data && (
        <>
          <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {filtered.length} {filtered.length === 1 ? "profesor" : "profesores"}
              {filtered.length !== data.length && (
                <> · <span style={{ color: "#aaa" }}>{data.length} en total</span></>
              )}
            </Typography>
            {isFetching && !isPending && <CircularProgress size={14} sx={{ color: "text.disabled" }} />}
            {sexFilter !== "" && (
              <Typography
                variant="caption"
                color="text.disabled"
                onClick={() => setSexFilter("")}
                sx={{ cursor: "pointer", "&:hover": { color: "text.secondary" } }}
              >
                Limpiar filtro
              </Typography>
            )}
          </Box>
          <ProfesorTable
            profesores={filtered}
            onEdit={handleEdit}
            onDelete={(p) => setDeleteTarget(p)}
            onSchedule={(p) => setScheduleProfesor(p)}
          />
        </>
      )}

      <AddEditProfesor open={addEditOpen} onClose={handleCloseForm} profesor={selected} />

      <DeleteConfirmation
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDelete={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />

      <ProfesorScheduleModal
        profesor={scheduleProfesor}
        open={!!scheduleProfesor}
        onClose={() => setScheduleProfesor(null)}
      />
    </Box>
  );
}
