import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import LockResetIcon from "@mui/icons-material/LockReset";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import SportsTennisIcon from "@mui/icons-material/SportsTennis";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGetUsers, apiCreateUser, apiDeleteUser, apiUpdateUser, apiGetUserStats } from "../../../api/authService";
import type { AdminUser, UserStats } from "../../../api/authService";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import DeleteDialog from "../../../components/common/DeleteDialog";
import PageLoader from "../../../components/common/PageLoader";
import FormLabel from "@mui/material/FormLabel";
import { FORM_LABEL_SX } from "../../../styles/formStyles";
import { SPORTS, SPORT_LABEL } from "../../../constants/sports";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

// ─── helpers ─────────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): Date {
  const d = new Date(dateStr + "T12:00:00"); // noon to avoid TZ shift
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function paymentStatus(lastPaymentDate: string | null): {
  nextDate: Date | null;
  label: string;
  color: "success" | "warning" | "error" | "default";
} {
  if (!lastPaymentDate) return { nextDate: null, label: "Sin registro", color: "default" };
  const next = addDays(lastPaymentDate, 30);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { nextDate: next, label: "Vencido", color: "error" };
  if (diff <= 7) return { nextDate: next, label: `Vence en ${diff}d`, color: "warning" };
  return { nextDate: next, label: "Al día", color: "success" };
}

// ─── Payment date dialog ──────────────────────────────────────────────────────

function PaymentDialog({
  user,
  token,
  onClose,
}: {
  user: AdminUser;
  token: string;
  onClose: () => void;
}) {
  const [dateValue, setDateValue] = useState(user.lastPaymentDate ?? "");
  const queryClient = useQueryClient();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const mutation = useMutation({
    mutationFn: () =>
      apiUpdateUser(token, user.id, { lastPaymentDate: dateValue || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      onClose();
    },
  });

  const nextDate = dateValue ? addDays(dateValue, 30) : null;

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Fecha de pago — {user.name}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
          <Box>
            <FormLabel sx={FORM_LABEL_SX}>Último pago</FormLabel>
            <TextField
              type="date"
              value={dateValue}
              onChange={e => setDateValue(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
          {nextDate && (
            <Box sx={{ bgcolor: "grey.50", borderRadius: 2, px: 2, py: 1.5, border: "1px solid", borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.65rem" }}>
                Próximo pago
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ mt: 0.25 }}>
                {nextDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </Typography>
            </Box>
          )}
          {dateValue && (
            <Button
              size="small"
              color="inherit"
              sx={{ alignSelf: "flex-start", textTransform: "none", color: "text.secondary", fontSize: "0.8rem" }}
              onClick={() => setDateValue("")}
            >
              Borrar registro de pago
            </Button>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
        <Button onClick={onClose} fullWidth={fullScreen} sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          fullWidth={fullScreen}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          {mutation.isPending ? "Guardando…" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Reset password dialog ────────────────────────────────────────────────────

function ResetPasswordDialog({ user, token, onClose }: { user: AdminUser; token: string; onClose: () => void }) {
  const [newPass, setNewPass]       = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showNew, setShowNew]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const mutation = useMutation({
    mutationFn: () => apiUpdateUser(token, user.id, { password: newPass }),
    onSuccess: () => { setSuccess(true); setNewPass(""); setConfirm(""); setError(null); },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Error al cambiar la contraseña."),
  });

  function handleSave() {
    setError(null);
    if (newPass !== confirm) { setError("Las contraseñas no coinciden."); return; }
    if (newPass.length < 6)  { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    mutation.mutate();
  }

  function passField(label: string, value: string, setter: (v: string) => void, show: boolean, setShow: (v: boolean) => void) {
    return (
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={FORM_LABEL_SX}>{label}</Typography>
        <TextField
          type={show ? "text" : "password"}
          value={value}
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
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Cambiar contraseña — {user.name}</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
          {passField("Nueva contraseña", newPass, setNewPass, showNew, setShowNew)}
          {passField("Confirmar nueva contraseña", confirm, setConfirm, showConfirm, setShowConfirm)}
          {error   && <Alert severity="error"   sx={{ borderRadius: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ borderRadius: 2 }}>Contraseña actualizada correctamente.</Alert>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
        <Button onClick={onClose} fullWidth={fullScreen} sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}>Cerrar</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!newPass || !confirm || mutation.isPending}
          fullWidth={fullScreen}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          {mutation.isPending ? "Guardando…" : "Cambiar contraseña"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Create user dialog ───────────────────────────────────────────────────────

function CreateUserDialog({ open, onClose, token }: { open: boolean; onClose: () => void; token: string }) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [sports, setSports] = useState<string[]>(["PADEL"]);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => apiCreateUser(token, { username, name, password, sports }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      handleClose();
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Error al crear el usuario."),
  });

  function handleClose() {
    setUsername(""); setName(""); setPassword(""); setShowPass(false); setSports(["PADEL"]); setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth fullScreen={fullScreen} PaperProps={{ sx: { borderRadius: fullScreen ? 0 : 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Crear usuario</DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
          {([
            { label: "Nombre de usuario", value: username, setter: setUsername, autoFocus: true },
            { label: "Nombre completo",   value: name,     setter: setName,     autoFocus: false },
          ] as const).map(({ label, value, setter, autoFocus }) => (
            <Box key={label}>
              <FormLabel sx={FORM_LABEL_SX}>{label}</FormLabel>
              <TextField value={value} onChange={e => setter(e.target.value)} required autoFocus={autoFocus} fullWidth size="small" autoComplete="off" />
            </Box>
          ))}
          <Box>
            <FormLabel sx={FORM_LABEL_SX}>Contraseña</FormLabel>
            <TextField
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required fullWidth size="small" autoComplete="new-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPass(v => !v)} edge="end">
                        {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
          <Box>
            <FormLabel sx={FORM_LABEL_SX}>Deportes</FormLabel>
            <Box sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              mt: 0.5,
              overflow: "hidden",
            }}>
              {SPORTS.map((s, idx) => {
                const checked = sports.includes(s.value);
                return (
                  <Box
                    key={s.value}
                    onClick={() => {
                      if (checked && sports.length === 1) return;
                      setSports(checked ? sports.filter(v => v !== s.value) : [...sports, s.value]);
                    }}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 1.5,
                      py: 0.5,
                      cursor: "pointer",
                      borderTop: idx > 0 ? "1px solid" : "none",
                      borderColor: "divider",
                      bgcolor: checked ? "rgba(245,173,39,0.08)" : "transparent",
                      "&:hover": { bgcolor: checked ? "rgba(245,173,39,0.14)" : "action.hover" },
                      transition: "background-color 150ms ease",
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      size="small"
                      disableRipple
                      tabIndex={-1}
                      sx={{
                        p: 0.5,
                        mr: 1,
                        color: "text.disabled",
                        "&.Mui-checked": { color: "#F5AD27" },
                      }}
                    />
                    <Typography variant="body2" fontWeight={checked ? 700 : 400} sx={{ color: checked ? "#b07d00" : "text.primary" }}>
                      {s.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
          {error && <Typography variant="body2" color="error">{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: fullScreen ? "column-reverse" : "row" }}>
        <Button onClick={handleClose} fullWidth={fullScreen} sx={{ textTransform: "none", borderRadius: 2, color: "text.secondary" }}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => mutation.mutate()}
          disabled={!username || !name || !password || mutation.isPending}
          fullWidth={fullScreen}
          startIcon={mutation.isPending ? <CircularProgress size={14} color="inherit" /> : undefined}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          {mutation.isPending ? "Creando…" : "Crear usuario"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── User stats metrics ───────────────────────────────────────────────────────

function OccupancyBar({ pct, name }: { pct: number; name: string }) {
  const color = pct >= 80 ? "#ef5350" : pct >= 50 ? "#F5AD27" : "#66bb6a";
  return (
    <Box sx={{ minWidth: 80 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
        <Typography sx={{ fontSize: "0.65rem", color: "text.secondary", fontWeight: 500 }} noWrap>{name}</Typography>
        <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color }}>{pct}%</Typography>
      </Box>
      <Box sx={{ height: 5, borderRadius: 3, bgcolor: "grey.100", overflow: "hidden" }}>
        <Box sx={{ height: "100%", width: `${pct}%`, bgcolor: color, borderRadius: 3, transition: "width 500ms ease" }} />
      </Box>
    </Box>
  );
}

function UserMetrics({ stats }: { stats: UserStats }) {
  return (
    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider", display: "flex", gap: { xs: 1.5, md: 3 }, flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* Counts */}
      <Box sx={{ display: "flex", gap: 2 }}>
        {[
          { icon: <PeopleOutlineIcon sx={{ fontSize: 14 }} />, label: "Jugadores", value: stats.playerCount },
          { icon: <SchoolOutlinedIcon sx={{ fontSize: 14 }} />, label: "Profesores", value: stats.profesorCount },
          { icon: <EmojiEventsOutlinedIcon sx={{ fontSize: 14 }} />, label: "Torneos activos", value: stats.tournamentCount },
        ].map(({ icon, label, value }) => (
          <Box key={label} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25, minWidth: 56 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, color: "text.secondary" }}>
              {icon}
              <Typography sx={{ fontSize: "0.65rem", color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {label}
              </Typography>
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1.1rem", lineHeight: 1 }}>{value}</Typography>
          </Box>
        ))}
      </Box>

      {/* Court occupancy bars */}
      {stats.courts.length > 0 && (
        <Box sx={{ flex: 1, minWidth: 180 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.75 }}>
            <SportsTennisIcon sx={{ fontSize: 13, color: "text.disabled" }} />
            <Typography sx={{ fontSize: "0.65rem", color: "text.disabled", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Ocupación canchas — últimos 30 días
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
            {stats.courts.map(c => <OccupancyBar key={c.id} name={c.name} pct={c.occupancyPct} />)}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({
  user,
  isSelf,
  token,
  onDelete,
  onEditPayment,
  onResetPassword,
}: {
  user: AdminUser;
  isSelf: boolean;
  token: string;
  onDelete: () => void;
  onEditPayment: () => void;
  onResetPassword: () => void;
}) {
  const queryClient = useQueryClient();
  const { impersonate } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery<UserStats>({
    queryKey: ["userStats", user.id],
    queryFn: () => apiGetUserStats(token, user.id),
    enabled: user.role !== "superadmin",
    staleTime: 60_000,
  });

  const impersonateMutation = useMutation({
    mutationFn: () => impersonate(user.id),
    onSuccess: () => navigate("/"),
  });

  const toggleMutation = useMutation({
    mutationFn: (isActive: boolean) => apiUpdateUser(token, user.id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
  });

  const { nextDate, label: payLabel, color: payColor } = paymentStatus(user.lastPaymentDate);
  const initials = user.name.split(" ").slice(0, 2).map(w => w[0].toUpperCase()).join("");

  return (
    <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        {/* Avatar */}
        <Avatar
          sx={{
            flexShrink: 0,
            bgcolor: user.role === "superadmin" ? "#F5AD27" : user.isActive ? "#111" : "grey.400",
            color: user.role === "superadmin" ? "#111" : "#fff",
            fontWeight: 700,
            fontSize: "0.85rem",
            width: 38,
            height: 38,
            mt: 0.25,
            transition: "background-color 200ms ease",
          }}
        >
          {initials}
        </Avatar>

        {/* Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Name + chips */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            <Typography variant="body2" fontWeight={700} sx={{ color: user.isActive ? "text.primary" : "text.disabled" }}>
              {user.name}
            </Typography>
            <Chip
              label={user.role === "superadmin" ? "Superadmin" : "Usuario"}
              size="small"
              sx={{
                height: 18, fontSize: "0.65rem", fontWeight: 700,
                bgcolor: user.role === "superadmin" ? "rgba(245,173,39,0.15)" : "rgba(0,0,0,0.07)",
                color: user.role === "superadmin" ? "#b07d00" : "text.secondary",
              }}
            />
            <Chip
              label={payLabel}
              size="small"
              color={payColor}
              variant={payColor === "default" ? "outlined" : "filled"}
              sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
            />
          </Box>

          {/* Username + sports */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              @{user.username}
            </Typography>
            {user.role !== "superadmin" && user.sports?.map(s => (
              <Chip
                key={s}
                label={SPORT_LABEL[s as keyof typeof SPORT_LABEL] ?? s}
                size="small"
                sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700, bgcolor: "rgba(245,173,39,0.10)", color: "#b07d00" }}
              />
            ))}
          </Box>

          {/* Payment dates */}
          <Box sx={{ display: "flex", gap: 2, mt: 0.5, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Último pago
              </Typography>
              <Typography variant="caption" display="block" sx={{ fontWeight: 500, color: "text.secondary" }}>
                {user.lastPaymentDate ? formatDate(user.lastPaymentDate) : "—"}
              </Typography>
            </Box>
            {nextDate && (
              <Box>
                <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.65rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Próximo pago
                </Typography>
                <Typography
                  variant="caption"
                  display="block"
                  sx={{
                    fontWeight: 600,
                    color: payColor === "error" ? "error.main" : payColor === "warning" ? "warning.dark" : "success.dark",
                  }}
                >
                  {nextDate.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Stats metrics */}
          {stats && <UserMetrics stats={stats} />}
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
          {!isSelf && (
            <Tooltip title={user.isActive ? "Deshabilitar usuario" : "Habilitar usuario"}>
              <Switch
                checked={user.isActive}
                size="small"
                disabled={toggleMutation.isPending}
                onChange={e => toggleMutation.mutate(e.target.checked)}
                color="success"
              />
            </Tooltip>
          )}
          {user.role !== "superadmin" && (
            <>
              <Tooltip title="Editar fecha de pago">
                <IconButton size="small" onClick={onEditPayment} sx={{ color: "text.secondary" }}>
                  <EditCalendarIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cambiar contraseña">
                <IconButton size="small" onClick={onResetPassword} sx={{ color: "text.secondary" }}>
                  <LockResetIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Acceder al portal del club">
                <IconButton
                  size="small"
                  disabled={!user.isActive || impersonateMutation.isPending}
                  onClick={() => impersonateMutation.mutate()}
                  sx={{ color: "primary.main" }}
                >
                  {impersonateMutation.isPending
                    ? <CircularProgress size={16} />
                    : <OpenInNewIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </>
          )}
          {!isSelf && (
            <Tooltip title="Eliminar usuario">
              <IconButton size="small" color="error" onClick={onDelete}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const { token, user: currentUser } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<AdminUser | null>(null);
  const [resetPassTarget, setResetPassTarget] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState("");
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [filterDisabled, setFilterDisabled] = useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isPending, isError } = useQuery<AdminUser[]>({
    queryKey: ["adminUsers"],
    queryFn: () => apiGetUsers(token!),
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDeleteUser(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      setDeleteTarget(null);
    },
  });

  const filtered = users.filter(u => {
    if (search.trim() && !u.name.toLowerCase().includes(search.trim().toLowerCase()) &&
        !u.username.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (filterDisabled && u.isActive) return false;
    if (filterOverdue) {
      const { color } = paymentStatus(u.lastPaymentDate);
      if (color !== "error") return false;
    }
    return true;
  });

  const overdueCount  = users.filter(u => paymentStatus(u.lastPaymentDate).color === "error").length;
  const disabledCount = users.filter(u => !u.isActive).length;

  if (isPending) return <PageLoader />;

  if (isError) {
    return (
      <Box>
        <PageHeader title="Gestión de usuarios" subtitle="Administración de cuentas de acceso" />
        <Alert severity="error" sx={{ borderRadius: 2 }}>No se pudieron cargar los usuarios.</Alert>
      </Box>
    );
  }

  return (
    <Box maxWidth={700}>
      <PageHeader
        title="Gestión de usuarios"
        subtitle="Administración de cuentas de acceso al sistema"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
          >
            Nuevo usuario
          </Button>
        }
      />

      {/* Search + filters */}
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Buscar por nombre o usuario…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Chip
          label={`Pago vencido${overdueCount ? ` (${overdueCount})` : ""}`}
          onClick={() => setFilterOverdue(v => !v)}
          color={filterOverdue ? "error" : "default"}
          variant={filterOverdue ? "filled" : "outlined"}
          size="small"
          sx={{ fontWeight: 600, cursor: "pointer" }}
        />
        <Chip
          label={`Deshabilitados${disabledCount ? ` (${disabledCount})` : ""}`}
          onClick={() => setFilterDisabled(v => !v)}
          color={filterDisabled ? "warning" : "default"}
          variant={filterDisabled ? "filled" : "outlined"}
          size="small"
          sx={{ fontWeight: 600, cursor: "pointer" }}
        />
      </Box>

      <Box sx={{
        border: "1.5px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden",
        maxHeight: "calc(100vh - 260px)", overflowY: "auto",
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: 4 },
      }}>
        {filtered.map((u, idx) => (
          <Box key={u.id}>
            {idx > 0 && <Divider />}
            <UserRow
              user={u}
              isSelf={u.id === currentUser?.id}
              token={token!}
              onDelete={() => setDeleteTarget(u)}
              onEditPayment={() => setPaymentTarget(u)}
              onResetPassword={() => setResetPassTarget(u)}
            />
          </Box>
        ))}
        {filtered.length === 0 && (
          <Box sx={{ px: 3, py: 4, textAlign: "center" }}>
            <Typography color="text.secondary">
              {users.length === 0 ? "No hay usuarios registrados." : "No hay usuarios que coincidan con los filtros."}
            </Typography>
          </Box>
        )}
      </Box>
      {filtered.length > 0 && filtered.length < users.length && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block", textAlign: "right" }}>
          Mostrando {filtered.length} de {users.length} usuarios
        </Typography>
      )}

      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} token={token!} />

      {paymentTarget && (
        <PaymentDialog user={paymentTarget} token={token!} onClose={() => setPaymentTarget(null)} />
      )}

      {resetPassTarget && (
        <ResetPasswordDialog user={resetPassTarget} token={token!} onClose={() => setResetPassTarget(null)} />
      )}

      <DeleteDialog
        open={!!deleteTarget}
        title="Eliminar usuario"
        description={`¿Estás seguro de que querés eliminar al usuario "${deleteTarget?.username ?? ""}"? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </Box>
  );
}
