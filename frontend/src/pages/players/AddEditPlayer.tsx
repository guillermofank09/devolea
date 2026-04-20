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
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPlayer, updatePlayer } from "../../api/playerService";
import type { Player, PlayerCategory, PlayerFormData, PlayerSex } from "../../types/Player";
import PhoneField from "../../components/common/PhoneField";
import AvatarUpload from "../../components/common/AvatarUpload";
import { FORM_LABEL_SX, FORM_INPUT_SX } from "../../styles/formStyles";
import { useAuth } from "../../context/AuthContext";
import { SPORT_LABEL } from "../../constants/sports";

// ── Georef Argentina city search ─────────────────────────────────────────────

interface CityOption {
  label: string;  // "Ciudad, Provincia" shown in dropdown and stored
}

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

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES: { value: PlayerCategory; label: string }[] = [
  { value: "SIN_CATEGORIA", label: "Sin Categoría" },
  { value: "PRIMERA",       label: "1ra" },
  { value: "SEGUNDA",       label: "2da" },
  { value: "TERCERA",       label: "3ra" },
  { value: "CUARTA",        label: "4ta" },
  { value: "QUINTA",        label: "5ta" },
  { value: "SEXTA",         label: "6ta" },
  { value: "SEPTIMA",       label: "7ma" },
];

const EMPTY: PlayerFormData = {
  name: "",
  category: "SIN_CATEGORIA",
  city: "",
  sex: "MASCULINO",
  birthDate: "",
  phone: "",
  sport: "",
  avatarUrl: "",
};

interface Props {
  open: boolean;
  onClose: () => void;
  player?: Player | null;
  onCreated?: (player: Player) => void;
}

export default function AddEditPlayer({ open, onClose, player, onCreated }: Props) {
  const [form, setForm] = useState<PlayerFormData>(EMPTY);

  // City autocomplete state
  const [cityInput, setCityInput] = useState("");
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();
  const isEditing = !!player;
  const { user } = useAuth();
  const userSports = user?.sports ?? [];
  const showSportSelector = userSports.length > 0;

  useEffect(() => {
    if (player) {
      setForm({
        name: player.name,
        category: player.category,
        city: player.city,
        sex: player.sex,
        birthDate: player.birthDate,
        phone: player.phone ?? "",
        sport: player.sport ?? "",
        avatarUrl: player.avatarUrl ?? "",
      });
      setCityInput(player.city);
    } else {
      setForm(EMPTY);
      setCityInput("");
    }
    setCityOptions([]);
  }, [player, open]);

  // Debounced Nominatim search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (cityInput.trim().length < 2) { setCityOptions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setCityLoading(true);
      try {
        const results = await searchCities(cityInput);
        setCityOptions(results);
      } catch {
        setCityOptions([]);
      } finally {
        setCityLoading(false);
      }
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [cityInput]);

  const set = (field: keyof PlayerFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const mutation = useMutation({
    mutationFn: (data: PlayerFormData) =>
      isEditing ? updatePlayer(player!.id, data) : createPlayer(data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["playersData"] });
      if (!isEditing && onCreated) onCreated(saved);
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const isValid = form.name.trim() && form.city.trim();


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {isEditing ? "Editar Jugador" : "Agregar Jugador"}
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Avatar */}
            <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
              <AvatarUpload
                name={form.name}
                value={form.avatarUrl}
                onChange={(url) => set("avatarUrl", url)}
                disabled={mutation.isPending}
              />
            </Box>

            {/* Nombre */}
            <Box>
              <FormLabel sx={FORM_LABEL_SX}>Nombre completo</FormLabel>
              <TextField
                fullWidth
                size="small"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ej: Juan Pérez"
                autoFocus
                disabled={mutation.isPending}
                sx={FORM_INPUT_SX}
              />
            </Box>

            {/* Ciudad + Fecha */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Ciudad</FormLabel>
                <Autocomplete
                  freeSolo
                  options={cityOptions}
                  getOptionLabel={(opt) => typeof opt === "string" ? opt : opt.label}
                  inputValue={cityInput}
                  onInputChange={(_, value) => { setCityInput(value); set("city", value); }}
                  onChange={(_, value) => {
                    if (!value) { set("city", ""); setCityInput(""); }
                    else if (typeof value === "string") { set("city", value); setCityInput(value); }
                    else { set("city", value.label); setCityInput(value.label); }
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

              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Fecha de nacimiento</FormLabel>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => set("birthDate", e.target.value)}
                  inputProps={{ max: new Date().toISOString().split("T")[0] }}
                  disabled={mutation.isPending}
                  sx={{
                    ...FORM_INPUT_SX,
                    "& input[type='date']::-webkit-calendar-picker-indicator": {
                      opacity: 0.5,
                      cursor: "pointer",
                      "&:hover": { opacity: 1 },
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Teléfono */}
            <PhoneField
              value={form.phone}
              onChange={(val) => set("phone", val)}
              disabled={mutation.isPending}
            />

            {/* Deporte — opciones según los deportes habilitados del club */}
            {showSportSelector && (
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Deporte</FormLabel>
                <Select
                  fullWidth
                  size="small"
                  value={form.sport ?? ""}
                  onChange={e => set("sport", e.target.value)}
                  disabled={mutation.isPending}
                  sx={{ height: 40, fontSize: "0.875rem" }}
                >
                  <MenuItem value=""><em>Sin especificar</em></MenuItem>
                  {userSports.map(s => (
                    <MenuItem key={s} value={s}>
                      {SPORT_LABEL[s as keyof typeof SPORT_LABEL] ?? s}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            )}

            {/* Categoría — solo para Pádel */}
            {form.sport === "PADEL" && (
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Categoría</FormLabel>
                <Select
                  fullWidth
                  size="small"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  disabled={mutation.isPending}
                  sx={{ height: 40, fontSize: "0.875rem" }}
                >
                  {CATEGORIES.map((c) => (
                    <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                  ))}
                </Select>
              </Box>
            )}

            {/* Sexo */}
            <Box>
              <FormLabel sx={FORM_LABEL_SX}>Sexo</FormLabel>
              <ToggleButtonGroup
                value={form.sex}
                exclusive
                onChange={(_, val) => val && set("sex", val as PlayerSex)}
                size="small"
                fullWidth
                sx={{
                  height: 40,
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    borderColor: "divider",
                    color: "text.secondary",
                    transition: "all 0.15s",
                  },
                  "& .MuiToggleButton-root.Mui-selected": {
                    bgcolor: "#F5AD27",
                    color: "#111",
                    borderColor: "#F5AD27",
                    "&:hover": { bgcolor: "#e09b18" },
                  },
                }}
              >
                <ToggleButton value="MASCULINO">Masculino</ToggleButton>
                <ToggleButton value="FEMENINO">Femenino</ToggleButton>
              </ToggleButtonGroup>
            </Box>

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
            disabled={!isValid || mutation.isPending}
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
