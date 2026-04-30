import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useToast } from "../../context/ToastContext";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import MiscellaneousServicesOutlinedIcon from "@mui/icons-material/MiscellaneousServicesOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import WcOutlinedIcon from "@mui/icons-material/WcOutlined";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import ShowerOutlinedIcon from "@mui/icons-material/ShowerOutlined";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import OutdoorGrillOutlinedIcon from "@mui/icons-material/OutdoorGrillOutlined";
import DeckOutlinedIcon from "@mui/icons-material/DeckOutlined";
import LocalParkingOutlinedIcon from "@mui/icons-material/LocalParkingOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import type { SvgIconComponent } from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, saveProfile } from "../../api/profileService";
import { uploadImage } from "../../api/uploadService";
import { apiChangePassword } from "../../api/authService";
import type { ClubProfile, DaySchedule } from "../../types/ClubProfile";
import { DEFAULT_HOURS } from "../../types/ClubProfile";
import PageHeader from "../../components/common/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import BusinessHoursEditor from "../../components/common/BusinessHoursEditor";
import PhoneField from "../../components/common/PhoneField";
import { useAuth } from "../../context/AuthContext";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import GoogleMapView from "../../components/common/GoogleMapView";

// ─── Section card ─────────────────────────────────────────────────────────────
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card elevation={0} sx={{ border: "1.5px solid", borderColor: "divider", borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box sx={{ color: "#F5AD27" }}>{icon}</Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        </Box>
        <Divider sx={{ mb: 2.5 }} />
        {children}
      </CardContent>
    </Card>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
      {children}
    </Typography>
  );
}

// ─── Logo uploader ────────────────────────────────────────────────────────────
function LogoUploader({
  logoUrl, logoPreview, uploading, error,
  onChange, onRemove,
}: {
  logoUrl: string; logoPreview: string | null; uploading: boolean; error: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onRemove: () => void;
}) {
  const src = logoPreview ?? (logoUrl || null);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, flexShrink: 0 }}>
      <Box
        component="label"
        sx={{
          position: "relative", width: 112, height: 112,
          borderRadius: "50%", overflow: "hidden", cursor: uploading ? "default" : "pointer",
          border: "2px solid", borderColor: error ? "error.main" : "divider",
          bgcolor: error ? "error.50" : "#111111",
          "&:hover .logo-overlay": { opacity: uploading ? 0 : 1 },
        }}
      >
        {src ? (
          <Box component="img" src={src} alt="logo"
            sx={{ width: "100%", height: "100%", objectFit: "contain", p: "10px" }} />
        ) : (
          <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 0.5 }}>
            <CameraAltOutlinedIcon sx={{ color: error ? "error.main" : "rgba(255,255,255,0.5)", fontSize: 28 }} />
            <Typography variant="caption" sx={{ color: error ? "error.main" : "rgba(255,255,255,0.5)" }}
              textAlign="center" lineHeight={1.3} px={1}>
              {error ? "Error al subir" : "Subir logo"}
            </Typography>
          </Box>
        )}
        <Box className="logo-overlay" sx={{
          position: "absolute", inset: 0, opacity: 0, transition: "opacity 150ms",
          bgcolor: "rgba(0,0,0,0.45)", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 0.5,
        }}>
          <CameraAltOutlinedIcon sx={{ color: "#fff", fontSize: 24 }} />
          <Typography variant="caption" sx={{ color: "#fff", fontSize: "0.65rem" }}>Cambiar</Typography>
        </Box>
        {uploading && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", bgcolor: "rgba(255,255,255,0.7)" }}>
            <CircularProgress size={22} />
          </Box>
        )}
        <input type="file" accept="image/*" hidden disabled={uploading} onChange={onChange} />
      </Box>

      {src && !uploading && (
        <Tooltip title="Eliminar logo">
          <IconButton size="small" onClick={onRemove} sx={{ color: "text.disabled", "&:hover": { color: "error.main" } }}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

// ─── Amenities ────────────────────────────────────────────────────────────────
const AMENITY_OPTIONS: { key: string; label: string; Icon: SvgIconComponent }[] = [
  { key: "Cantina",   label: "Cantina",   Icon: RestaurantOutlinedIcon   },
  { key: "Baños",     label: "Baños",     Icon: WcOutlinedIcon           },
  { key: "Vestuario", label: "Vestuario", Icon: CheckroomOutlinedIcon    },
  { key: "Duchas",    label: "Duchas",    Icon: ShowerOutlinedIcon       },
  { key: "Wifi",      label: "Wifi",      Icon: WifiOutlinedIcon         },
  { key: "Parrillas", label: "Parrillas", Icon: OutdoorGrillOutlinedIcon },
  { key: "Quinchos",        label: "Quinchos",          Icon: DeckOutlinedIcon              },
  { key: "Estacionamiento", label: "Estacionamiento",   Icon: LocalParkingOutlinedIcon       },
  { key: "Artículos Deportivos", label: "Artículos Deportivos", Icon: ShoppingBagOutlinedIcon },
];

// ─── Password section ─────────────────────────────────────────────────────────
function PasswordSection({ token }: { token: string }) {
  const [current, setCurrent]         = useState("");
  const [next, setNext]               = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);

  const mutation = useMutation({
    mutationFn: () => apiChangePassword(token, current, next),
    onSuccess: () => { setCurrent(""); setNext(""); setConfirm(""); setError(null); setSuccess(true); },
    onError: (e: any) => { setError(e?.response?.data?.message ?? "Error al cambiar la contraseña."); },
  });

  function handleSave() {
    setError(null);
    if (next !== confirm) { setError("Las contraseñas nuevas no coinciden."); return; }
    if (next.length < 6)  { setError("La nueva contraseña debe tener al menos 6 caracteres."); return; }
    mutation.mutate();
  }

  function passField(label: string, value: string, setter: (v: string) => void, show: boolean, setShow: (v: boolean) => void) {
    return (
      <Box>
        <FieldLabel>{label}</FieldLabel>
        <TextField
          type={show ? "text" : "password"} value={value}
          onChange={e => setter(e.target.value)}
          fullWidth size="small" autoComplete="new-password"
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
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {passField("Contraseña actual", current, setCurrent, showCurrent, setShowCurrent)}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          {passField("Nueva contraseña", next, setNext, showNext, setShowNext)}
          {passField("Confirmar nueva contraseña", confirm, setConfirm, showConfirm, setShowConfirm)}
        </Box>
      </Box>

      {error   && <Alert severity="error"   sx={{ mt: 2, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setSuccess(false)}>Contraseña actualizada correctamente.</Alert>}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2.5 }}>
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
  const showToast = useToast();
  const { data, isPending, isError } = useQuery<ClubProfile>({
    queryKey: ["clubProfile"],
    queryFn: fetchProfile,
    retry: 1,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: saveProfile,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clubProfile"] }); showToast("Perfil guardado correctamente"); },
    onError: () => showToast("Error al guardar el perfil. Intentá de nuevo.", "error"),
  });

  // ── form state ────────────────────────────────────────────────────────────
  const [clubName,      setClubName]      = useState("");
  const [logoUrl,       setLogoUrl]       = useState("");
  const [logoPreview,   setLogoPreview]   = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError,     setLogoError]     = useState(false);
  const logoPreviewRef = useRef<string | null>(null);
  const [address,   setAddress]   = useState("");
  const [phone,     setPhone]     = useState("");
  const [lat,       setLat]       = useState<number | null>(null);
  const [lng,       setLng]       = useState<number | null>(null);
  const [hours,     setHours]     = useState<DaySchedule[]>(DEFAULT_HOURS);
  const [amenities, setAmenities] = useState<string[]>([]);

  // ── Google Maps ───────────────────────────────────────────────────────────
  const placesLib    = useMapsLibrary("places");
  const geocodingLib = useMapsLibrary("geocoding");
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [geocoder,    setGeocoder]   = useState<google.maps.Geocoder | null>(null);
  const [addrInput,   setAddrInput]  = useState("");
  const [addrOptions, setAddrOptions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrValue,   setAddrValue]  = useState<google.maps.places.AutocompletePrediction | null>(null);
  const [addrVerified, setAddrVerified] = useState(false);

  useEffect(() => { if (placesLib)    setAutocompleteService(new placesLib.AutocompleteService()); }, [placesLib]);
  useEffect(() => { if (geocodingLib) setGeocoder(new geocodingLib.Geocoder()); },                   [geocodingLib]);

  // populate when data loads
  useEffect(() => {
    if (!data) return;
    setClubName(data.clubName ?? "");
    setLogoUrl(data.logoUrl ?? data.logoBase64 ?? "");
    setAddress(data.address ?? "");
    setPhone(data.phone ?? "");
    setAddrInput(data.address ?? "");
    setLat(data.latitude ?? null);
    setLng(data.longitude ?? null);
    setAddrVerified(!!(data.latitude && data.longitude));
    setHours(data.businessHours?.length ? data.businessHours : DEFAULT_HOURS);
    setAmenities(data.amenities ?? []);
    setLogoError(false);
  }, [data]);

  // ── dirty state ───────────────────────────────────────────────────────────
  const savedHours     = data?.businessHours?.length ? data.businessHours : DEFAULT_HOURS;
  const savedAmenities = data?.amenities ?? [];

  const isDirty = useMemo(() => {
    if (!data) return false;
    return (
      clubName  !== (data.clubName  ?? "")                           ||
      logoUrl   !== (data.logoUrl ?? data.logoBase64 ?? "")          ||
      address   !== (data.address  ?? "")                            ||
      phone     !== (data.phone    ?? "")                            ||
      JSON.stringify([...amenities].sort()) !== JSON.stringify([...savedAmenities].sort()) ||
      JSON.stringify(hours) !== JSON.stringify(savedHours)
    );
  }, [data, clubName, logoUrl, address, phone, amenities, hours, savedAmenities, savedHours]);

  // debounced Places autocomplete
  useEffect(() => {
    if (addrInput.length < 3 || !autocompleteService) { setAddrOptions([]); return; }
    const timer = setTimeout(async () => {
      setAddrLoading(true);
      try { const r = await autocompleteService.getPlacePredictions({ input: addrInput }); setAddrOptions(r.predictions ?? []); }
      catch { setAddrOptions([]); }
      finally { setAddrLoading(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [addrInput, autocompleteService]);

  const handlePlaceSelect = useCallback(async (p: google.maps.places.AutocompletePrediction) => {
    setAddrValue(p);
    setAddrInput(p.description);
    setAddress(p.description);
    setAddrVerified(false);
    if (!geocoder) return;
    try {
      const r = await geocoder.geocode({ placeId: p.place_id });
      const loc = r.results[0]?.geometry?.location;
      if (loc) { setLat(loc.lat()); setLng(loc.lng()); setAddrVerified(true); }
    } catch { /* lat/lng stays null */ }
  }, [geocoder]);

  // ── logo upload ───────────────────────────────────────────────────────────
  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setLogoError(false);
    if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
    const objectUrl = URL.createObjectURL(file);
    logoPreviewRef.current = objectUrl;
    setLogoPreview(objectUrl);
    setLogoUploading(true);
    uploadImage(file, "logos")
      .then(url => { setLogoUrl(url); setLogoPreview(null); URL.revokeObjectURL(objectUrl); logoPreviewRef.current = null; })
      .catch(() => { setLogoPreview(null); setLogoError(true); })
      .finally(() => setLogoUploading(false));
  }

  // ── save ──────────────────────────────────────────────────────────────────
  function handleSave() {
    mutation.mutate({ clubName, logoUrl, logoBase64: undefined, address, phone, latitude: lat, longitude: lng, businessHours: hours, amenities });
  }

  if (isPending) return <PageLoader />;

  if (isError) {
    return (
      <Box>
        <PageHeader title="Mi Club" subtitle="Información del club y configuración general" />
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          No se pudo conectar con el servidor. Verificá que el backend esté corriendo.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: { xs: 14, md: 10 } }}>
      <PageHeader title="Mi Club" subtitle="Información del club y configuración general" />

      <Grid container spacing={3} alignItems="flex-start">

        {/* ── Columna izquierda ── */}
        <Grid size={{ xs: 12, md: 6 }}>

          {/* ── Datos del club ── */}
          <Section icon={<StorefrontOutlinedIcon />} title="Datos del club">
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2.5, alignItems: { xs: "center", sm: "flex-start" } }}>
              <LogoUploader
                logoUrl={logoUrl} logoPreview={logoPreview}
                uploading={logoUploading} error={logoError}
                onChange={handleLogoChange} onRemove={() => { setLogoUrl(""); setLogoError(false); }}
              />
              <Box sx={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: 1.25 }}>
                <Box>
                  <FieldLabel>Nombre del club</FieldLabel>
                  <TextField
                    fullWidth size="small"
                    placeholder="Ej. Club Deportivo Devolea"
                    value={clubName}
                    onChange={e => setClubName(e.target.value)}
                  />
                </Box>
                <PhoneField value={phone} onChange={setPhone} label="Teléfono / WhatsApp" />
              </Box>
            </Box>
          </Section>

          {/* ── Servicios ── */}
          <Section icon={<MiscellaneousServicesOutlinedIcon />} title="Servicios del club">
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                Seleccioná los servicios disponibles en tu club.
              </Typography>
              {amenities.length > 0 && (
                <Typography variant="caption" fontWeight={700} sx={{ color: "#111", bgcolor: "#F5AD2722", px: 1, py: 0.25, borderRadius: 10, whiteSpace: "nowrap", ml: 1 }}>
                  {amenities.length} / {AMENITY_OPTIONS.length}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {AMENITY_OPTIONS.map(({ key, label, Icon }) => {
                const selected = amenities.includes(key);
                return (
                  <Chip
                    key={key}
                    label={label}
                    icon={<Icon sx={{ fontSize: "1rem !important" }} />}
                    onClick={() => setAmenities(prev =>
                      selected ? prev.filter(a => a !== key) : [...prev, key]
                    )}
                    variant={selected ? "filled" : "outlined"}
                    sx={{
                      cursor: "pointer",
                      fontWeight: selected ? 700 : 400,
                      fontSize: "0.8rem",
                      bgcolor: selected ? "#fff8e8" : "transparent",
                      borderColor: selected ? "#F5AD27" : "divider",
                      borderWidth: selected ? "1.5px" : "1px",
                      color: selected ? "#7a5200" : "text.secondary",
                      "& .MuiChip-icon": { color: selected ? "#F5AD27" : "text.disabled" },
                      "&:hover": {
                        bgcolor: selected ? "#ffefc4" : "action.hover",
                        borderColor: selected ? "#e09b18" : "text.disabled",
                      },
                      transition: "all 150ms",
                    }}
                  />
                );
              })}
            </Box>
          </Section>

          {/* ── Horarios ── */}
          <Section icon={<AccessTimeOutlinedIcon />} title="Horarios de atención">
            <BusinessHoursEditor value={hours} onChange={setHours} />
          </Section>

        </Grid>

        {/* ── Columna derecha ── */}
        <Grid size={{ xs: 12, md: 6 }}>

          {/* ── Ubicación ── */}
          <Section icon={<LocationOnOutlinedIcon />} title="Ubicación">
            <FieldLabel>Dirección del club</FieldLabel>
            <Autocomplete
              freeSolo
              options={addrOptions}
              getOptionLabel={opt => (typeof opt === "string" ? opt : opt.description)}
              loading={addrLoading}
              value={addrValue}
              inputValue={addrInput}
              filterOptions={x => x}
              onInputChange={(_, val, reason) => {
                setAddrInput(val);
                if (reason === "input") { setAddress(val); setLat(null); setLng(null); setAddrValue(null); setAddrVerified(false); }
              }}
              onChange={(_, opt) => { if (!opt || typeof opt === "string") return; handlePlaceSelect(opt); }}
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder="Buscá la dirección del club…"
                  size="small"
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (<>{addrLoading && <PageLoader size={16} />}{params.InputProps.endAdornment}</>),
                    },
                    formHelperText: { sx: { ml: 0, mt: 0.5, fontSize: "0.72rem" } },
                  }}
                  helperText={
                    addrVerified
                      ? undefined
                      : "Escribí para buscar con Google Maps"
                  }
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.place_id}>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", py: 0.25 }}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 15, mt: 0.3, color: "text.secondary", flexShrink: 0 }} />
                    <Box>
                      <Typography variant="body2" sx={{ lineHeight: 1.3, fontWeight: 500 }}>
                        {option.structured_formatting?.main_text ?? option.description}
                      </Typography>
                      {option.structured_formatting?.secondary_text && (
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                          {option.structured_formatting.secondary_text}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </li>
              )}
            />

            {/* Verified badge */}
            {addrVerified && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.75 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 14, color: "success.main" }} />
                <Typography variant="caption" color="success.main" fontWeight={600}>
                  Ubicación verificada en el mapa
                </Typography>
              </Box>
            )}

            {lat && lng && (
              <Box sx={{ mt: 1.5, borderRadius: 2, overflow: "hidden", border: "1.5px solid", borderColor: "divider", height: 220 }}>
                <GoogleMapView lat={lat} lng={lng} height={220} interactive />
              </Box>
            )}
          </Section>

          {/* ── Contraseña ── */}
          <PasswordSection token={token!} />

        </Grid>
      </Grid>

      {/* ── Sticky save bar ── */}
      <Box sx={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1200,
        px: { xs: 2, md: 4 }, py: { xs: 1.25, md: 1.5 },
        bgcolor: "background.paper",
        borderTop: "1.5px solid", borderColor: "divider",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 2, boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
      }}>
        <Typography variant="body2" color={isDirty ? "text.primary" : "text.disabled"} fontWeight={isDirty ? 600 : 400}
          sx={{ display: { xs: "none", sm: "block" } }}>
          {isDirty ? "Tenés cambios sin guardar" : "Sin cambios"}
        </Typography>

        <Button
          variant="contained"
          size="medium"
          fullWidth
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />}
          disabled={!isDirty || mutation.isPending || logoUploading}
          onClick={handleSave}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3, maxWidth: { xs: "100%", sm: 200 } }}
        >
          {mutation.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </Box>

    </Box>
  );
}
