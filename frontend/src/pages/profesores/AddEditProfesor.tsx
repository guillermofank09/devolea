import { useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  FormLabel,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import { format, parseISO } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProfesor, updateProfesor } from "../../api/profesorService";
import { fetchCourts } from "../../api/courtService";
import type { Court } from "../../types/Court";
import type { Profesor, ProfesorFormData } from "../../types/Profesor";
import type { DaySchedule } from "../../types/ClubProfile";
import { DEFAULT_HOURS } from "../../types/ClubProfile";
import PhoneField from "../../components/common/PhoneField";
import BusinessHoursEditor from "../../components/common/BusinessHoursEditor";
import AvatarUpload from "../../components/common/AvatarUpload";
import { FORM_LABEL_SX, FORM_INPUT_SX } from "../../styles/formStyles";
import { useAuth } from "../../context/AuthContext";
import { SPORT_LABEL } from "../../constants/sports";

interface CityOption { label: string; }

async function searchCities(query: string): Promise<CityOption[]> {
  if (query.trim().length < 2) return [];
  const url = `https://apis.datos.gob.ar/georef/api/localidades?nombre=${encodeURIComponent(query)}&campos=nombre,provincia.nombre&max=10&orden=nombre`;
  const res = await fetch(url);
  const data = await res.json();
  const seen = new Set<string>();
  return (data.localidades ?? []).reduce((acc: CityOption[], loc: any) => {
    const label = `${loc.nombre}, ${loc.provincia.nombre}`;
    if (!seen.has(label.toLowerCase())) { seen.add(label.toLowerCase()); acc.push({ label }); }
    return acc;
  }, []);
}

const EMPTY: ProfesorFormData = { name: "", phone: "", sex: "", avatarUrl: "", city: "", birthDate: "", sports: [] };

const FUTBOL_TYPE_LABEL: Record<string, string> = {
  FUTBOL5: "Fútbol 5", FUTBOL7: "Fútbol 7", FUTBOL9: "Fútbol 9", FUTBOL11: "Fútbol 11",
};

const SPORTS_WITH_CLASS = ["PADEL", "TENIS", "FUTBOL"];

function toProfesorSportOptions(courts: Court[], clubSports: string[]): { key: string; label: string }[] {
  const seen = new Set<string>();
  const rows: { key: string; label: string }[] = [];
  for (const sport of clubSports) {
    if (!SPORTS_WITH_CLASS.includes(sport)) continue;
    const sportCourts = courts.filter(c => c.sport === sport);
    if (sport === "FUTBOL") {
      const types = [...new Set(sportCourts.map(c => c.type as string).filter(t => t.startsWith("FUTBOL")))];
      for (const t of types) {
        if (!seen.has(t)) { seen.add(t); rows.push({ key: t, label: FUTBOL_TYPE_LABEL[t] ?? t }); }
      }
    } else if (sportCourts.length > 0) {
      if (!seen.has(sport)) { seen.add(sport); rows.push({ key: sport, label: SPORT_LABEL[sport as keyof typeof SPORT_LABEL] ?? sport }); }
    }
  }
  return rows;
}

interface Props {
  open: boolean;
  onClose: () => void;
  profesor?: Profesor | null;
}

export default function AddEditProfesor({ open, onClose, profesor }: Props) {
  const { user } = useAuth();
  const clubSports = user?.sports ?? ["PADEL"];

  const { data: courts = [] } = useQuery<Court[]>({
    queryKey: ["courtsData"],
    queryFn: () => fetchCourts(),
    staleTime: 60_000,
  });

  const sportOptions = toProfesorSportOptions(courts, clubSports);

  const [form, setForm] = useState<ProfesorFormData>(EMPTY);
  const [hourlyRateStr, setHourlyRateStr] = useState("");
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_HOURS);
  const [error, setError] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();
  const isEditing = !!profesor;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (cityInput.trim().length < 2) { setCityOptions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setCityLoading(true);
      try { setCityOptions(await searchCities(cityInput)); }
      catch { setCityOptions([]); }
      finally { setCityLoading(false); }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [cityInput]);

  useEffect(() => {
    if (!open) return;
    if (profesor) {
      const savedSports = profesor.sports?.length
        ? profesor.sports.filter(s => sportOptions.some(o => o.key === s))
        : (profesor.sport ? [profesor.sport] : []);
      setForm({ name: profesor.name, phone: profesor.phone ?? "", sex: profesor.sex ?? "", avatarUrl: profesor.avatarUrl ?? "", city: profesor.city ?? "", birthDate: profesor.birthDate ?? "", sports: savedSports });
      setCityInput(profesor.city ?? "");
      setHourlyRateStr(profesor.hourlyRate != null ? String(profesor.hourlyRate) : "");
      setSchedule(profesor.schedule?.length ? profesor.schedule : DEFAULT_HOURS);
    } else {
      setForm(EMPTY);
      setCityInput("");
      setHourlyRateStr("");
      setSchedule(DEFAULT_HOURS);
    }
    setCityOptions([]);
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesor, open]);

  const mutation = useMutation({
    mutationFn: (data: ProfesorFormData) => {
      const payload = {
        ...data,
        sex: data.sex || undefined,
        avatarUrl: data.avatarUrl || undefined,
        birthDate: data.birthDate || undefined,
        hourlyRate: hourlyRateStr ? Number(hourlyRateStr) : undefined,
        sports: data.sports ?? [],
        schedule,
      };
      return isEditing ? updateProfesor(profesor!.id, payload) : createProfesor(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profesoresData"] });
      onClose();
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error ?? "Error al guardar el profesor");
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
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {isEditing ? "Editar profesor" : "Agregar profesor"}
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
                fullWidth
                size="small"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Juan Pérez"
                autoFocus
                disabled={mutation.isPending}
                sx={FORM_INPUT_SX}
              />
            </Box>

            <PhoneField
              value={form.phone}
              onChange={(val) => setForm(p => ({ ...p, phone: val }))}
              disabled={mutation.isPending}
            />

            {/* Ciudad + Fecha de nacimiento */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <Box>
                <FormLabel sx={FORM_LABEL_SX}>Ciudad</FormLabel>
                <Autocomplete
                  freeSolo
                  options={cityOptions}
                  getOptionLabel={(opt) => typeof opt === "string" ? opt : opt.label}
                  inputValue={cityInput}
                  onInputChange={(_, value) => { setCityInput(value); setForm(p => ({ ...p, city: value })); }}
                  onChange={(_, value) => {
                    const val = !value ? "" : typeof value === "string" ? value : value.label;
                    setForm(p => ({ ...p, city: val }));
                    setCityInput(val);
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
                            <>{cityLoading && <CircularProgress size={14} />}{params.InputProps.endAdornment}</>
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
                    onChange={d => setForm(p => ({ ...p, birthDate: d ? format(d, "yyyy-MM-dd") : "" }))}
                    maxDate={new Date()}
                    disabled={mutation.isPending}
                    slotProps={{ textField: { fullWidth: true, size: "small", sx: FORM_INPUT_SX } }}
                  />
                </LocalizationProvider>
              </Box>
            </Box>

            {/* Deportes + Precio */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
              {sportOptions.length > 0 && (
                <Box sx={{ flex: 1 }}>
                  <FormLabel sx={FORM_LABEL_SX}>Deportes</FormLabel>
                  <FormGroup row>
                    {sportOptions.map(({ key, label }) => {
                      const checked = (form.sports ?? []).includes(key);
                      return (
                        <FormControlLabel
                          key={key}
                          disabled={mutation.isPending}
                          control={
                            <Checkbox
                              checked={checked}
                              onChange={() => setForm(p => {
                                const current = p.sports ?? [];
                                return { ...p, sports: checked ? current.filter(s => s !== key) : [...current, key] };
                              })}
                              size="small"
                              sx={{ color: "text.secondary", "&.Mui-checked": { color: "#F5AD27" } }}
                            />
                          }
                          label={label}
                          sx={{ "& .MuiFormControlLabel-label": { fontSize: "0.875rem", fontWeight: 500 } }}
                        />
                      );
                    })}
                  </FormGroup>
                </Box>
              )}
              <Box sx={{ width: sportOptions.length > 0 ? 160 : "100%" }}>
                <FormLabel sx={FORM_LABEL_SX}>Precio por hora</FormLabel>
                <TextField
                  fullWidth
                  size="small"
                  type="text"
                  inputMode="decimal"
                  value={hourlyRateStr}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === "" || /^\d*\.?\d*$/.test(v))
                      setHourlyRateStr(v.replace(/^0+(\d)/, "$1"));
                  }}
                  placeholder="0"
                  disabled={mutation.isPending}
                  slotProps={{
                    input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                  }}
                  helperText="Tarifa propia. Vacío = precio general."
                  sx={FORM_INPUT_SX}
                />
              </Box>
            </Box>

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

            <Box>
              <Divider sx={{ mb: 2 }} />
              <FormLabel sx={{ ...FORM_LABEL_SX, display: "block", mb: 1.5 }}>Horarios de clases</FormLabel>
              <BusinessHoursEditor
                value={schedule}
                onChange={setSchedule}
                disabled={mutation.isPending}
              />
            </Box>

            {error && (
              <Typography variant="body2" color="error">{error}</Typography>
            )}
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
