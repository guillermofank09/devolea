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
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import { format, parseISO } from "date-fns";
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

const PADEL_CATEGORIES: { value: PlayerCategory; label: string }[] = [
  { value: "SIN_CATEGORIA", label: "Sin Categoría" },
  { value: "PRIMERA",       label: "1ra" },
  { value: "SEGUNDA",       label: "2da" },
  { value: "TERCERA",       label: "3ra" },
  { value: "CUARTA",        label: "4ta" },
  { value: "QUINTA",        label: "5ta" },
  { value: "SEXTA",         label: "6ta" },
  { value: "SEPTIMA",       label: "7ma" },
];

const TENIS_CATEGORIES: { value: PlayerCategory; label: string }[] = [
  { value: "SIN_CATEGORIA", label: "Sin Categoría" },
  { value: "PRIMERA",       label: "1ra" },
  { value: "SEGUNDA",       label: "2da" },
  { value: "TERCERA",       label: "3ra" },
  { value: "CUARTA",        label: "4ta" },
];

const EMPTY: PlayerFormData = {
  name: "",
  category: "SIN_CATEGORIA",
  tenisCategory: "SIN_CATEGORIA",
  city: "",
  sex: "MASCULINO",
  birthDate: "",
  phone: "",
  sports: [],
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
        tenisCategory: player.tenisCategory ?? "SIN_CATEGORIA",
        city: player.city,
        sex: player.sex,
        birthDate: player.birthDate,
        phone: player.phone ?? "",
        sports: player.sports ?? (player.sport ? [player.sport] : []),
        avatarUrl: player.avatarUrl ?? "",
      });
      setCityInput(player.city ?? "");
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

  const isValid = form.name.trim();


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

            {/* Teléfono */}
            <PhoneField
              value={form.phone ?? ""}
              onChange={(val) => set("phone", val)}
              disabled={mutation.isPending}
            />

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
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    value={form.birthDate ? parseISO(form.birthDate) : null}
                    onChange={d => set("birthDate", d ? format(d, "yyyy-MM-dd") : "")}
                    maxDate={new Date()}
                    disabled={mutation.isPending}
                    slotProps={{
                      textField: { fullWidth: true, size: "small", sx: FORM_INPUT_SX },
                    }}
                  />
                </LocalizationProvider>
              </Box>
            </Box>

            {/* Deporte — opciones según los deportes habilitados del club */}
            {showSportSelector && (
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Deportes</FormLabel>
                <FormGroup row>
                  {userSports.map(s => {
                    const checked = (form.sports ?? []).includes(s);
                    return (
                      <FormControlLabel
                        key={s}
                        disabled={mutation.isPending}
                        control={
                          <Checkbox
                            checked={checked}
                            onChange={() => setForm(prev => {
                              const current = prev.sports ?? [];
                              return { ...prev, sports: checked ? current.filter(x => x !== s) : [...current, s] };
                            })}
                            size="small"
                            sx={{ color: "text.secondary", "&.Mui-checked": { color: "#F5AD27" } }}
                          />
                        }
                        label={SPORT_LABEL[s as keyof typeof SPORT_LABEL] ?? s}
                        sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.875rem", fontWeight: 500 } }}
                      />
                    );
                  })}
                </FormGroup>
              </Box>
            )}

            {/* Categorías — Pádel y/o Tenis */}
            {(form.sports?.includes("PADEL") || form.sports?.includes("TENIS")) && (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: form.sports!.includes("PADEL") && form.sports!.includes("TENIS") ? "1fr 1fr" : "1fr" }, gap: 2 }}>
                {form.sports?.includes("PADEL") && (
                  <Box>
                    <FormLabel sx={FORM_LABEL_SX}>Categoría Pádel</FormLabel>
                    <Select fullWidth size="small" value={form.category} onChange={(e) => set("category", e.target.value)} disabled={mutation.isPending} sx={{ height: 40, fontSize: "0.875rem" }}>
                      {PADEL_CATEGORIES.map((c) => (
                        <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                )}
                {form.sports?.includes("TENIS") && (
                  <Box>
                    <FormLabel sx={FORM_LABEL_SX}>Categoría Tenis</FormLabel>
                    <Select fullWidth size="small" value={form.tenisCategory ?? "SIN_CATEGORIA"} onChange={(e) => set("tenisCategory", e.target.value)} disabled={mutation.isPending} sx={{ height: 40, fontSize: "0.875rem" }}>
                      {TENIS_CATEGORIES.map((c) => (
                        <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                )}
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
