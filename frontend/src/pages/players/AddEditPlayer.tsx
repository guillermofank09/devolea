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
import { FORM_LABEL_SX, FORM_INPUT_SX } from "../../styles/formStyles";

// ── Nominatim city search ─────────────────────────────────────────────────────

interface CityOption {
  label: string;       // display name shown in dropdown
  city: string;        // clean city name stored in the form
}

async function searchCities(query: string): Promise<CityOption[]> {
  if (query.trim().length < 2) return [];
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}` +
    `&format=json&limit=8&addressdetails=1` +
    `&countrycodes=ar` +
    `&featuretype=city,town,village`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "es", "User-Agent": "DevoleatClubManager/1.0" },
  });
  const data: any[] = await res.json();

  const seen = new Set<string>();
  const results: CityOption[] = [];

  for (const place of data) {
    const addr = place.address ?? {};
    // Extract the most specific locality name available
    const city =
      addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county ?? place.display_name.split(",")[0];
    const state = addr.state ?? "";
    const label = [city, state].filter(Boolean).join(", ");

    if (!seen.has(city.toLowerCase())) {
      seen.add(city.toLowerCase());
      results.push({ label, city });
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

  useEffect(() => {
    if (player) {
      setForm({
        name: player.name,
        category: player.category,
        city: player.city,
        sex: player.sex,
        birthDate: player.birthDate,
        phone: player.phone ?? "",
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

  const isValid = form.name.trim() && form.city.trim() && form.birthDate;


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
                    else { set("city", value.city); setCityInput(value.city); }
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

            {/* Categoría */}
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
