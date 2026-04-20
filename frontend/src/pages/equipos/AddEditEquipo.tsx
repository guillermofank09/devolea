import { useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEquipo, updateEquipo } from "../../api/equipoService";
import type { Equipo, EquipoFormData } from "../../types/Equipo";
import type { Court } from "../../types/Court";
import { fetchCourts } from "../../api/courtService";
import AvatarUpload from "../../components/common/AvatarUpload";
import { FORM_LABEL_SX, FORM_INPUT_SX } from "../../styles/formStyles";
import { useAuth } from "../../context/AuthContext";
import { isTeamSport, SPORT_LABELS } from "../tournaments/AddEditTournament";
import { MenuItem, Select } from "@mui/material";

// ── Georef Argentina city search ──────────────────────────────────────────────

interface CityOption { label: string; }

async function searchCities(query: string): Promise<CityOption[]> {
  if (query.trim().length < 2) return [];
  const url =
    `https://apis.datos.gob.ar/georef/api/localidades` +
    `?nombre=${encodeURIComponent(query)}` +
    `&campos=nombre,provincia.nombre` +
    `&max=10&orden=nombre`;
  const res = await fetch(url);
  const data = await res.json();
  const localidades: any[] = data.localidades ?? [];
  const seen = new Set<string>();
  const results: CityOption[] = [];
  for (const loc of localidades) {
    const label = `${loc.nombre}, ${loc.provincia.nombre}`;
    if (!seen.has(label.toLowerCase())) {
      seen.add(label.toLowerCase());
      results.push({ label });
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────────────

const EMPTY: EquipoFormData = { name: "", city: "", sex: "", sport: "", avatarUrl: "" };

interface Props {
  open: boolean;
  onClose: () => void;
  equipo?: Equipo | null;
}

export default function AddEditEquipo({ open, onClose, equipo }: Props) {
  const [form, setForm] = useState<EquipoFormData>(EMPTY);
  const [cityInput, setCityInput] = useState("");
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();
  const isEditing = !!equipo;
  const { user } = useAuth();
  const teamSports = (user?.sports ?? []).filter(s => isTeamSport(s));
  const hasFutbol = teamSports.includes("FUTBOL");
  const showSportSelector = teamSports.length > 1;

  const { data: courts = [] } = useQuery<Court[]>({
    queryKey: ["courtsData"],
    queryFn: () => fetchCourts(),
    enabled: open && hasFutbol,
  });

  const sportOptions: { value: string; label: string }[] = [];
  for (const s of teamSports) {
    if (s === "FUTBOL") {
      const futbolTypes = [...new Set(courts.filter(c => c.sport === "FUTBOL").map(c => c.type as string))]
        .filter(t => t.startsWith("FUTBOL")).sort();
      if (futbolTypes.length > 0) {
        futbolTypes.forEach(t => sportOptions.push({ value: t, label: SPORT_LABELS[t] ?? t }));
      } else {
        sportOptions.push({ value: "FUTBOL", label: SPORT_LABELS["FUTBOL"] ?? "Fútbol" });
      }
    } else {
      sportOptions.push({ value: s, label: SPORT_LABELS[s] ?? s });
    }
  }

  useEffect(() => {
    if (equipo) {
      setForm({ name: equipo.name, city: equipo.city ?? "", sex: equipo.sex ?? "", sport: equipo.sport ?? "", avatarUrl: equipo.avatarUrl ?? "" });
      setCityInput(equipo.city ?? "");
    } else {
      setForm(EMPTY);
      setCityInput("");
    }
    setCityOptions([]);
    setError(null);
  }, [equipo, open]);

  // Debounced city search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (cityInput.trim().length < 2) { setCityOptions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setCityLoading(true);
      try {
        setCityOptions(await searchCities(cityInput));
      } catch {
        setCityOptions([]);
      } finally {
        setCityLoading(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [cityInput]);

  const mutation = useMutation({
    mutationFn: (data: EquipoFormData) => {
      const payload = { ...data, sex: data.sex || undefined, sport: data.sport || undefined, avatarUrl: data.avatarUrl || undefined };
      return isEditing ? updateEquipo(equipo!.id, payload) : createEquipo(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equiposData"] });
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error ?? "Error al guardar el equipo");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate(form);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {isEditing ? "Editar equipo" : "Agregar equipo"}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Avatar */}
            <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
              <AvatarUpload
                name={form.name}
                value={form.avatarUrl}
                onChange={(url) => setForm(p => ({ ...p, avatarUrl: url }))}
                disabled={mutation.isPending}
              />
            </Box>

            <Box>
              <FormLabel sx={FORM_LABEL_SX}>Nombre</FormLabel>
              <TextField
                fullWidth size="small"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Los Tigres FC"
                autoFocus
                disabled={mutation.isPending}
                sx={FORM_INPUT_SX}
              />
            </Box>

            <Box>
              <FormLabel sx={FORM_LABEL_SX}>Ciudad</FormLabel>
              <Autocomplete
                freeSolo
                options={cityOptions}
                getOptionLabel={(opt) => typeof opt === "string" ? opt : opt.label}
                inputValue={cityInput}
                onInputChange={(_, value) => { setCityInput(value); setForm(p => ({ ...p, city: value })); }}
                onChange={(_, value) => {
                  if (!value) { setForm(p => ({ ...p, city: "" })); setCityInput(""); }
                  else if (typeof value === "string") { setForm(p => ({ ...p, city: value })); setCityInput(value); }
                  else { setForm(p => ({ ...p, city: value.label })); setCityInput(value.label); }
                  setCityOptions([]);
                }}
                loading={cityLoading}
                noOptionsText="Sin resultados"
                filterOptions={(x) => x}
                disabled={mutation.isPending}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Ej: Buenos Aires"
                    sx={FORM_INPUT_SX}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {cityLoading && <CircularProgress size={14} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Box>

            {showSportSelector && (
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Deporte</FormLabel>
                <Select
                  fullWidth
                  size="small"
                  value={form.sport ?? ""}
                  onChange={e => setForm(p => ({ ...p, sport: e.target.value }))}
                  disabled={mutation.isPending}
                  sx={{ height: 40, fontSize: "0.875rem" }}
                >
                  <MenuItem value=""><em>Sin especificar</em></MenuItem>
                  {sportOptions.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </Box>
            )}

            <Box>
              <FormLabel sx={FORM_LABEL_SX}>Sexo</FormLabel>
              <ToggleButtonGroup
                value={form.sex || null}
                exclusive
                onChange={(_, val) => setForm(p => ({ ...p, sex: val ?? "" }))}
                size="small"
                fullWidth
                disabled={mutation.isPending}
                sx={{
                  height: 40,
                  "& .MuiToggleButton-root": {
                    textTransform: "none", fontWeight: 600, fontSize: "0.875rem",
                    borderColor: "divider", color: "text.secondary", transition: "all 0.15s",
                  },
                  "& .MuiToggleButton-root.Mui-selected": {
                    bgcolor: "#F5AD27", color: "#111", borderColor: "#F5AD27",
                    "&:hover": { bgcolor: "#e09b18" },
                  },
                }}
              >
                <ToggleButton value="MASCULINO">Masculino</ToggleButton>
                <ToggleButton value="FEMENINO">Femenino</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {error && <Typography variant="body2" color="error">{error}</Typography>}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
          <Button
            onClick={onClose}
            fullWidth={fullScreen}
            sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={!form.name.trim() || mutation.isPending}
            fullWidth={fullScreen}
            startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
          >
            {mutation.isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Agregar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
