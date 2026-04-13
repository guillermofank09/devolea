import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/UploadOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, saveProfile } from "../../api/profileService";
import { apiChangePassword } from "../../api/authService";
import type { ClubProfile, DaySchedule } from "../../types/ClubProfile";
import { DEFAULT_HOURS } from "../../types/ClubProfile";
import PageHeader from "../../components/common/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import BusinessHoursEditor from "../../components/common/BusinessHoursEditor";
import { useAuth } from "../../context/AuthContext";

// ─── Nominatim (OpenStreetMap) ────────────────────────────────────────────────
interface NominatimPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

async function searchAddress(query: string): Promise<NominatimPlace[]> {
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "es", "User-Agent": "DevoleatClubManager/1.0" },
  });
  return res.json();
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card elevation={0} sx={{ border: "1.5px solid", borderColor: "divider", borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
          <Box sx={{ color: "#F5AD27" }}>{icon}</Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        </Box>
        <Divider sx={{ mb: 2.5 }} />
        {children}
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
// ─── Password section ─────────────────────────────────────────────────────────
function PasswordSection({ token }: { token: string }) {
  const [current, setCurrent]     = useState("");
  const [next, setNext]           = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);

  const mutation = useMutation({
    mutationFn: () => apiChangePassword(token, current, next),
    onSuccess: () => {
      setCurrent(""); setNext(""); setConfirm("");
      setError(null);
      setSuccess(true);
    },
    onError: (e: any) => {
      setError(e?.response?.data?.message ?? "Error al cambiar la contraseña.");
    },
  });

  function handleSave() {
    setError(null);
    if (next !== confirm) { setError("Las contraseñas nuevas no coinciden."); return; }
    if (next.length < 6)  { setError("La nueva contraseña debe tener al menos 6 caracteres."); return; }
    mutation.mutate();
  }

  function passField(
    label: string,
    value: string,
    setter: (v: string) => void,
    show: boolean,
    setShow: (v: boolean) => void,
  ) {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
          {label}
        </Typography>
        <TextField
          type={show ? "text" : "password"}
          value={value}
          onChange={e => setter(e.target.value)}
          fullWidth
          size="small"
          autoComplete="new-password"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" onClick={() => setShow(!show)}>
                    {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
    );
  }

  return (
    <Section icon={<LockOutlinedIcon />} title="Cambiar contraseña">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          {passField("Contraseña actual", current, setCurrent, showCurrent, setShowCurrent)}
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          {passField("Nueva contraseña", next, setNext, showNext, setShowNext)}
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          {passField("Confirmar nueva contraseña", confirm, setConfirm, showConfirm, setShowConfirm)}
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setSuccess(false)}>
          Contraseña actualizada correctamente.
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button
          variant="contained"
          disabled={!current || !next || !confirm || mutation.isPending}
          onClick={handleSave}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          {mutation.isPending ? "Guardando…" : "Cambiar contraseña"}
        </Button>
      </Box>
    </Section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Profile() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { data, isPending, isError } = useQuery<ClubProfile>({
    queryKey: ["clubProfile"],
    queryFn: fetchProfile,
    retry: 1,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: saveProfile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clubProfile"] });
      setSnack(true);
    },
  });

  // ── form state ──
  const [clubName, setClubName]     = useState("");
  const [logoBase64, setLogoBase64] = useState("");
  const [address, setAddress]       = useState("");
  const [lat, setLat]               = useState<number | null>(null);
  const [lng, setLng]               = useState<number | null>(null);
  const [hours, setHours]           = useState<DaySchedule[]>(DEFAULT_HOURS);
  const [snack, setSnack]           = useState(false);

  // ── address autocomplete state ──
  const [addrInput, setAddrInput]         = useState("");
  const [addrOptions, setAddrOptions]     = useState<NominatimPlace[]>([]);
  const [addrLoading, setAddrLoading]     = useState(false);
  const [addrValue, setAddrValue]         = useState<NominatimPlace | null>(null);

  // populate when data loads
  useEffect(() => {
    if (!data) return;
    setClubName(data.clubName ?? "");
    setLogoBase64(data.logoBase64 ?? "");
    setAddress(data.address ?? "");
    setAddrInput(data.address ?? "");
    setLat(data.latitude ?? null);
    setLng(data.longitude ?? null);
    setHours(data.businessHours?.length ? data.businessHours : DEFAULT_HOURS);
  }, [data]);

  // debounced Nominatim search
  useEffect(() => {
    if (addrInput.length < 3) { setAddrOptions([]); return; }
    const timer = setTimeout(async () => {
      setAddrLoading(true);
      try {
        const results = await searchAddress(addrInput);
        setAddrOptions(results);
      } catch {
        setAddrOptions([]);
      } finally {
        setAddrLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [addrInput]);

  // ── logo upload ──
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogoBase64(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── save ──
  function handleSave() {
    mutation.mutate({ clubName, logoBase64, address, latitude: lat, longitude: lng, businessHours: hours });
  }

  if (isPending) return <PageLoader />;

  if (isError) {
    return (
      <Box>
        <PageHeader title="Gestión de Perfil" subtitle="Información del club y configuración general" />
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          No se pudo conectar con el servidor. Verificá que el backend esté corriendo.
        </Alert>
      </Box>
    );
  }

  return (
    <Box maxWidth={760}>
      <PageHeader title="Gestión de Perfil" subtitle="Información del club y configuración general" />

      {/* ── Club info ── */}
      <Section icon={<StorefrontOutlinedIcon />} title="Información del Club">
        <Grid container spacing={3} alignItems="flex-start">
          <Grid size={{ xs: 12, sm: 8 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
              Nombre del club
            </Typography>
            <TextField
              fullWidth
              placeholder="Ej. Club de Pádel Devolea"
              value={clubName}
              onChange={e => setClubName(e.target.value)}
              size="small"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
              Logotipo
            </Typography>
            <Box
              component="label"
              sx={{
                width: "100%",
                height: 90,
                border: "2px dashed",
                borderColor: "divider",
                borderRadius: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
                cursor: "pointer",
                overflow: "hidden",
                transition: "border-color 150ms",
                "&:hover": { borderColor: "text.secondary" },
              }}
            >
              {logoBase64 ? (
                <Box
                  component="img"
                  src={logoBase64}
                  alt="logo"
                  sx={{ width: "100%", height: "100%", objectFit: "contain", p: 1 }}
                />
              ) : (
                <>
                  <UploadIcon sx={{ color: "text.disabled", fontSize: 22 }} />
                  <Typography variant="caption" color="text.disabled" textAlign="center" lineHeight={1.3}>
                    Subir imagen
                  </Typography>
                </>
              )}
              <input type="file" accept="image/*" hidden onChange={handleLogoChange} />
            </Box>
            {logoBase64 && (
              <Button
                size="small"
                color="error"
                onClick={() => setLogoBase64("")}
                sx={{ textTransform: "none", mt: 0.5, fontSize: "0.72rem" }}
              >
                Eliminar logo
              </Button>
            )}
          </Grid>
        </Grid>
      </Section>

      {/* ── Location ── */}
      <Section icon={<LocationOnOutlinedIcon />} title="Ubicación">
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
          Dirección del club
        </Typography>

        {/* ── Embedded map ── */}
        {lat && lng && (
          <Box
            sx={{
              mb: 2,
              borderRadius: 2,
              overflow: "hidden",
              border: "1.5px solid",
              borderColor: "divider",
              height: 220,
              position: "relative",
            }}
          >
            <iframe
              title="Ubicación del club"
              width="100%"
              height="100%"
              style={{ border: 0, display: "block" }}
              src={
                `https://www.openstreetmap.org/export/embed.html` +
                `?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}` +
                `&layer=mapnik&marker=${lat},${lng}`
              }
              loading="lazy"
            />
            <Box
              component="a"
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                position: "absolute",
                bottom: 6,
                right: 6,
                bgcolor: "rgba(255,255,255,0.9)",
                borderRadius: 1,
                px: 1,
                py: 0.25,
                fontSize: "0.65rem",
                color: "text.secondary",
                textDecoration: "none",
                backdropFilter: "blur(4px)",
                "&:hover": { color: "primary.main" },
              }}
            >
              Ver en OpenStreetMap ↗
            </Box>
          </Box>
        )}

        <Autocomplete
          freeSolo
          options={addrOptions}
          getOptionLabel={opt => (typeof opt === "string" ? opt : opt.display_name)}
          loading={addrLoading}
          value={addrValue}
          inputValue={addrInput}
          filterOptions={x => x}   // disable built-in filter — Nominatim handles it
          onInputChange={(_, val, reason) => {
            setAddrInput(val);
            if (reason === "input") {
              // clear coordinates when user is typing a new address
              setAddress(val);
              setLat(null);
              setLng(null);
              setAddrValue(null);
            }
          }}
          onChange={(_, opt) => {
            if (!opt || typeof opt === "string") return;
            setAddrValue(opt);
            setAddress(opt.display_name);
            setAddrInput(opt.display_name);
            setLat(parseFloat(opt.lat));
            setLng(parseFloat(opt.lon));
          }}
          renderInput={params => (
            <TextField
              {...params}
              placeholder="Buscá la dirección del club…"
              size="small"
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {addrLoading && <CircularProgress size={16} sx={{ mr: 1 }} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
                formHelperText: { sx: { ml: 0, mt: 0.5, fontSize: "0.72rem" } },
              }}
              helperText={
                lat && lng
                  ? `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`
                  : "Escribí para buscar con OpenStreetMap (Nominatim)"
              }
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.place_id}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", py: 0.25 }}>
                <LocationOnOutlinedIcon sx={{ fontSize: 15, mt: 0.3, color: "text.secondary", flexShrink: 0 }} />
                <Typography variant="body2" sx={{ lineHeight: 1.4 }}>{option.display_name}</Typography>
              </Box>
            </li>
          )}
        />
      </Section>

      {/* ── Business hours ── */}
      <Section icon={<AccessTimeOutlinedIcon />} title="Horarios de Atención">
        <BusinessHoursEditor value={hours} onChange={setHours} />
      </Section>

      {/* ── Password ── */}
      <PasswordSection token={token!} />

      {/* ── Save ── */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
        {mutation.isError && (
          <Typography variant="body2" color="error" alignSelf="center">
            Error al guardar. Intentá de nuevo.
          </Typography>
        )}
        <Button
          variant="contained"
          size="large"
          startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
          disabled={mutation.isPending}
          onClick={handleSave}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 4 }}
        >
          {mutation.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </Box>

      <Snackbar
        open={snack}
        autoHideDuration={3000}
        onClose={() => setSnack(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSnack(false)} sx={{ borderRadius: 2 }}>
          Perfil guardado correctamente
        </Alert>
      </Snackbar>
    </Box>
  );
}
